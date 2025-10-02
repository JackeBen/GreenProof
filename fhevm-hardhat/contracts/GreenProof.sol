// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IGreenBadgeNFT {
    function mint(address to, uint8 level) external;
    function hasLevel(address user, uint8 level) external view returns (bool);
}

/// @title GreenProof - 记录环保行为与加密贡献值的 FHE 合约
/// @notice 行为明文上链（分类/描述/时间），贡献值使用 FHE 加密存储并支持授权解密；内置徽章与排行榜（次数榜）
contract GreenProof is SepoliaConfig {
    struct Action {
        uint256 timestamp;      // 明文时间戳
        string category;        // 明文分类
        string description;     // 明文描述
        euint32 value;          // 加密贡献值（32 位足够，单位自定义）
    }

    // 用户地址 => 行为记录列表
    mapping(address => Action[]) private _userActions;

    // 总环保次数（明文即可）
    uint256 private _totalActions;

    // 用户总次数（明文统计，用于排行榜次数榜）
    mapping(address => uint256) public userActionCount;

    // 用户累积贡献（加密累计，用于隐私友好）
    mapping(address => euint32) private _userEncryptedSum;   // FHE 累计
    mapping(address => euint32) private _userEncryptedCount; // FHE 次数（与明文次数并存）

    // 用户集合（用于简易排行遍历）
    address[] private _users;
    mapping(address => bool) private _seen;

    // 徽章合约
    IGreenBadgeNFT public immutable badge;

    // 阈值（简化为次数门槛；贡献值门槛需结合 off-chain 解密或后续接口扩展）
    uint256 public constant BADGE_LV1_COUNT = 1;
    uint256 public constant BADGE_LV2_COUNT = 20;

    event ActionRecorded(address indexed user, string category, uint256 value, uint256 timestamp);
    event BadgeMinted(address indexed user, uint8 level);

    constructor(address badgeAddress) {
        badge = IGreenBadgeNFT(badgeAddress);
    }

    /// @notice 记录环保行为（贡献值为加密输入），并进行标量运算/选择/最值的示例处理
    function recordAction(
        string memory category,
        string memory description,
        externalEuint32 inputValue32,
        bytes calldata inputProof
    ) external {
        // 将外部密文转为内部加密类型
        euint32 v = FHE.fromExternal(inputValue32, inputProof);

        // 方案A：按用户输入的值直接记录（最多裁剪到上限）
        euint32 cap = FHE.asEuint32(100);
        euint32 clipped = FHE.min(v, cap);

        // 写入行为
        Action memory a = Action({
            timestamp: block.timestamp,
            category: category,
            description: description,
            value: clipped
        });
        _userActions[msg.sender].push(a);

        // 第一次写入加入用户集合
        if (!_seen[msg.sender]) {
            _seen[msg.sender] = true;
            _users.push(msg.sender);
        }

        // 维护累计（加密）与次数（加密 + 明文双轨）
        _userEncryptedSum[msg.sender] = FHE.add(_userEncryptedSum[msg.sender], clipped);
        _userEncryptedCount[msg.sender] = FHE.add(_userEncryptedCount[msg.sender], 1);
        userActionCount[msg.sender] += 1;
        _totalActions += 1;

        // 授权：允许合约自身和用户解密其新增的加密值与累计值/次数
        FHE.allowThis(a.value);
        FHE.allow(a.value, msg.sender);
        FHE.allowThis(_userEncryptedSum[msg.sender]);
        FHE.allow(_userEncryptedSum[msg.sender], msg.sender);
        FHE.allowThis(_userEncryptedCount[msg.sender]);
        FHE.allow(_userEncryptedCount[msg.sender], msg.sender);

        // 不进行链上解密，避免信息泄露；事件 value 置 0 仅作占位
        emit ActionRecorded(msg.sender, category, 0, block.timestamp);

        // 徽章改为“手动领取”，不再在记录时自动发放
    }

    /// @notice 获取用户行为列表（返回加密贡献值，前端再解密）
    function getUserActions(address user) external view returns (Action[] memory) {
        return _userActions[user];
    }

    /// @notice 返回用户加密累计贡献（前端调用 userDecrypt 解密）
    function getUserEncryptedSum(address user) external view returns (euint32) {
        return _userEncryptedSum[user];
    }

    /// @notice 返回用户加密次数（前端调用 userDecrypt 解密）
    function getUserEncryptedCount(address user) external view returns (euint32) {
        return _userEncryptedCount[user];
    }

    /// @notice 是否达到阈值：阈值为外部加密输入，避免 view 中创建新密文
    function isCountAtLeast(address user, externalEuint32 threshold, bytes calldata proof) external returns (ebool) {
        euint32 thr = FHE.fromExternal(threshold, proof);
        return FHE.ge(_userEncryptedCount[user], thr);
    }

    /// @notice 在不泄露条件的前提下，将“加密阈值判断”的结果选择性地影响加密累计（演示 select）
    /// @dev 如果加上 inc 后超过 cap，则裁剪至 cap；否则正常相加
    function cappedAccumulate(uint32 inc, uint32 capPlain) external {
        euint32 incE = FHE.asEuint32(inc);
        euint32 cap = FHE.asEuint32(capPlain);
        euint32 tentative = FHE.add(_userEncryptedSum[msg.sender], incE);
        ebool exceed = FHE.gt(tentative, cap);
        euint32 selected = FHE.select(exceed, cap, tentative);
        _userEncryptedSum[msg.sender] = selected;

        FHE.allowThis(_userEncryptedSum[msg.sender]);
        FHE.allow(_userEncryptedSum[msg.sender], msg.sender);
    }

    /// @notice 将本人数据授权给某地址进行解密（持久授权）
    function grantAccess(address to) external {
        FHE.allow(_userEncryptedSum[msg.sender], to);
        FHE.allow(_userEncryptedCount[msg.sender], to);
        uint256 len = _userActions[msg.sender].length;
        if (len > 0) {
            FHE.allow(_userActions[msg.sender][len - 1].value, to);
        }
    }

    /// @notice 将本人数据授权给某地址解密（仅当前交易临时授权）
    function grantTransientAccess(address to) external {
        FHE.allowTransient(_userEncryptedSum[msg.sender], to);
        FHE.allowTransient(_userEncryptedCount[msg.sender], to);
        uint256 len = _userActions[msg.sender].length;
        if (len > 0) {
            FHE.allowTransient(_userActions[msg.sender][len - 1].value, to);
        }
    }

    /// @notice 获取总环保次数（明文）
    function getTotalActions() external view returns (uint256) {
        return _totalActions;
    }

    /// @notice 次数榜 Top N（默认 N=10）
    function getTopUsers(uint256 limit) external view returns (address[] memory) {
        uint256 n = _users.length;
        if (limit == 0) limit = 10;
        if (n == 0) return new address[](0);

        address[] memory top = new address[](limit);
        uint256[] memory best = new uint256[](limit);

        for (uint256 i = 0; i < n; i++) {
            address u = _users[i];
            uint256 s = userActionCount[u];

            for (uint256 k = 0; k < limit; k++) {
                if (s > best[k]) {
                    for (uint256 m = limit - 1; m > k; m--) {
                        best[m] = best[m - 1];
                        top[m] = top[m - 1];
                    }
                    best[k] = s;
                    top[k] = u;
                    break;
                }
            }
        }
        return top;
    }

    /// @notice 用户主动领取徽章（暂支持 Lv1/Lv2 基于次数门槛；Lv3 需后续扩展）
    function mintBadge(uint8 level) external {
        if (level == 1 && userActionCount[msg.sender] >= BADGE_LV1_COUNT) {
            _safeAward(msg.sender, 1);
        } else if (level == 2 && userActionCount[msg.sender] >= BADGE_LV2_COUNT) {
            _safeAward(msg.sender, 2);
        } else {
            revert("badge:unsupported-or-not-eligible");
        }
    }

    function _tryAwardBadges(address user) internal {
        if (userActionCount[user] >= BADGE_LV1_COUNT) {
            _safeAward(user, 1);
        }
        if (userActionCount[user] >= BADGE_LV2_COUNT) {
            _safeAward(user, 2);
        }
    }

    function _safeAward(address user, uint8 level) internal {
        if (!badge.hasLevel(user, level)) {
            badge.mint(user, level);
            emit BadgeMinted(user, level);
        }
    }
}
