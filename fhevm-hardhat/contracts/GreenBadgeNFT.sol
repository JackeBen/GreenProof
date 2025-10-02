// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title GreenBadgeNFT - 简易徽章 NFT：3 个等级，按地址和等级唯一
contract GreenBadgeNFT is ERC721, Ownable {
    // tokenId 自增
    uint256 private _nextId;

    // user => level => owned
    mapping(address => mapping(uint8 => bool)) private _ownedLevel;

    // tokenId => level
    mapping(uint256 => uint8) public tokenLevel;

    // 基础 URI（指向 IPFS 前缀）
    string private _base;

    // 允许的铸造者（GreenProof）
    mapping(address => bool) public minters;

    constructor(string memory baseURI) ERC721("GreenBadge", "GBADGE") Ownable(msg.sender) {
        _base = baseURI;
        _nextId = 1;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _base = baseURI;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minters[account] = allowed;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    function hasLevel(address user, uint8 level) external view returns (bool) {
        return _ownedLevel[user][level];
    }

    function mint(address to, uint8 level) external {
        require(minters[msg.sender], "not minter");
        require(level >= 1 && level <= 3, "invalid level");
        require(!_ownedLevel[to][level], "already owned");

        uint256 tid = _nextId++;
        _safeMint(to, tid);
        _ownedLevel[to][level] = true;
        tokenLevel[tid] = level;
    }
}


