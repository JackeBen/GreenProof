"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useGreenProof } from "@/hooks/useGreenProof";

export default function RecordPage() {
  const { isConnected, connect } = useWallet();
  const { contract, fhevmInstance, address, fheStatus, fheError, chainId } = useGreenProof();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState<number>(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0); // 分类相关的“数量/里程/用电量”等

  // 简易经验系数（kg CO₂ / 单位），仅用于前端估算提示，不影响合约逻辑
  const FACTORS: Record<string, { unit: string; factor: number; hint: string } > = {
    "无车出行": { unit: "公里", factor: 0.21, hint: "每公里≈0.21kg CO₂（燃油车替代）" },
    "节约用水": { unit: "升", factor: 0.0003, hint: "每升用水全生命周期≈0.0003kg CO₂" },
    "使用可再生能源": { unit: "kWh", factor: 0.6, hint: "每kWh 与火电对比≈0.6kg CO₂" },
    "植树或环保活动": { unit: "棵", factor: 21, hint: "每棵树年均吸收≈21kg CO₂（取典型值）" },
    "垃圾分类": { unit: "千克", factor: 0.1, hint: "每千克分类处理≈0.1kg CO₂ 减排（粗估）" },
  };

  const selectedFactor = FACTORS[category as keyof typeof FACTORS];
  const estimated = selectedFactor ? Math.max(0, Math.round((amount || 0) * selectedFactor.factor)) : 0;

  const categories = [
    { value: "垃圾分类", icon: "♻️", color: "from-blue-500 to-cyan-500" },
    { value: "无车出行", icon: "🚴", color: "from-green-500 to-emerald-500" },
    { value: "节约用水", icon: "💧", color: "from-blue-400 to-blue-600" },
    { value: "使用可再生能源", icon: "🔋", color: "from-yellow-500 to-orange-500" },
    { value: "植树或环保活动", icon: "🌳", color: "from-green-600 to-green-800" },
  ];

  const submit = async () => {
    if (!category || value <= 0) {
      setStatus("⚠️ 请填写完整信息");
      return;
    }

    if (!isConnected) {
      setStatus("⚠️ 请先连接钱包");
      return;
    }

    if (!contract || !fhevmInstance) {
      const isSepolia = chainId === 11155111;
      const msg = !isConnected
        ? "⚠️ 请先连接钱包"
        : (chainId !== null && chainId !== undefined && !isSepolia)
          ? "⚠️ 请切换到 Sepolia 网络"
          : fheStatus === "loading"
            ? "⚠️ 正在初始化 FHEVM..."
            : "⚠️ FHEVM 实例不可用";
      setStatus(msg + (fheError ? ` (${fheError.message})` : ""));
      return;
    }

    try {
      setLoading(true);
      setStatus("🔐 正在加密贡献值...");

      // 1. 创建加密输入
      const input = fhevmInstance.createEncryptedInput(contract.target, address);
      // 确保传入的是整数并在 uint32 范围
      const v = Math.max(0, Math.floor(Number(value)));
      input.add32(v);

      // 延迟让 UI 有时间响应
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. 加密
      const encryptedData = await input.encrypt();

      setStatus("🌍 环保足迹正在上链...");

      // 3. 调用合约
      const tx = await contract.recordAction(
        category,
        description || "",
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      setStatus(`⏳ 等待交易确认... ${tx.hash.slice(0, 10)}...`);

      // 4. 等待确认
      await tx.wait();

      setStatus("✅ 你的环保行为已永久记录在区块链上！");

      // 重置表单
      setTimeout(() => {
        setCategory("");
        setDescription("");
        setValue(0);
      }, 2000);
    } catch (error: any) {
      console.error("上链失败:", error);
      setStatus(`❌ 上链失败: ${error.message || "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              GreenProof
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center space-y-6">
            <div className="text-6xl">🔗</div>
            <h2 className="text-2xl font-bold text-gray-800">连接钱包</h2>
            <p className="text-gray-600">请先连接 MetaMask 钱包并切换到 Sepolia 测试网</p>
            <button
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              连接 MetaMask
            </button>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-8">
          {/* 标题 */}
          <div className="text-center space-y-2">
            <div className="text-6xl animate-float">🌱</div>
            <h2 className="text-3xl font-bold text-gray-800">记录环保行为</h2>
            <p className="text-gray-600">让你的环保贡献被永久铭记</p>
          </div>

          {/* 行为类型选择 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">选择行为类型</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    category === cat.value
                      ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg scale-105`
                      : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className={`text-sm font-medium ${category === cat.value ? "text-white" : "text-gray-700"}`}>
                    {cat.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 描述输入 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              行为描述 <span className="text-gray-400 font-normal">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：今天骑自行车上班，减少碳排放..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
              rows={3}
            />
          </div>

          {/* 贡献估值 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">环保贡献估值</label>
            <div className="relative">
              <input
                type="number"
                value={value || ""}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder={selectedFactor ? `直接填写估算的 CO₂（单位 kg），或使用下方快速估算` : "输入贡献值（单位 kg CO₂）"}
                className="w-full p-4 pr-24 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">kg CO₂</div>
            </div>

            {selectedFactor && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="text-sm text-gray-700">
                  快速估算 · {selectedFactor.hint}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder={`输入${selectedFactor.unit}`}
                    className="w-40 p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  />
                  <span className="text-gray-600">→ 约</span>
                  <span className="px-3 py-2 bg-white rounded-lg border border-green-200 text-green-700 font-semibold">
                    {estimated} kg CO₂
                  </span>
                  <button
                    type="button"
                    onClick={() => setValue(estimated)}
                    className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:shadow-md transition"
                  >
                    应用到上方
                  </button>
                </div>
                <div className="text-xs text-gray-500">仅作粗略参考，实际减排取决于场景与统计口径。</div>
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🔄</span>
                上链中...
              </span>
            ) : (
              "🌍 上链记录"
            )}
          </button>

          {/* 状态提示 */}
          {status && (
            <div
              className={`p-4 rounded-xl text-center font-medium ${
                status.includes("✅")
                  ? "bg-green-100 text-green-800"
                  : status.includes("⚠️")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              } animate-slide-up`}
            >
              {status}
            </div>
          )}

          {/* 返回首页 */}
          <div className="text-center">
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              ← 返回首页
            </Link>
          </div>
        </div>
        )}

        {/* 涟漪动画提示 */}
        <div className="mt-8 text-center text-gray-500 text-sm animate-fade-in" style={{ animationDelay: "0.5s" }}>
          💡 提示：你的贡献值将使用 FHEVM 加密存储，确保隐私安全
        </div>
      </div>
    </main>
  );
}
