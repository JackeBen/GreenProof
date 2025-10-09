"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { LeafParticles } from "@/components/LeafParticles";
import { useGreenProof } from "@/hooks/useGreenProof";

export default function Page() {
  const { isConnected, address, connect, chainId, switchToSepolia } = useWallet();
  const short = address ? `${address.slice(0,6)}...${address.slice(-4)}` : "";
  const { fheStatus, fheError } = useGreenProof();

  const statusBar = (() => {
    if (!isConnected) return { text: "未连接钱包", color: "bg-yellow-100 text-yellow-800" };
    if (chainId !== 11155111) return { text: "请切换到 Sepolia 网络", color: "bg-yellow-100 text-yellow-800" };
    if (fheStatus === "loading") return { text: "正在初始化 FHEVM...", color: "bg-blue-100 text-blue-800" };
    if (fheStatus === "error") return { text: `FHEVM 实例不可用${fheError ? `（${fheError.message}）` : ""}` , color: "bg-red-100 text-red-800" };
    if (fheStatus === "ready") return { text: "FHEVM 就绪", color: "bg-green-100 text-green-800" };
    return undefined;
  })();

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 绿叶飘落动画背景（客户端渲染，避免水合不一致） */}
      <LeafParticles />

      {/* 导航栏 */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              GreenProof
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/me" className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-lg transition">
              我的足迹
            </Link>
            <Link href="/top" className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-lg transition">
              排行榜
            </Link>
            <Link href="/badges" className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-lg transition">
              徽章
            </Link>
            {!isConnected ? (
              <button
                onClick={connect}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:shadow-md transition"
              >
                连接钱包
              </button>
            ) : (
              <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-mono text-sm">
                {short}
              </span>
            )}
            {isConnected && chainId !== 11155111 && (
              <button
                onClick={switchToSepolia}
                className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
              >
                一键切到 Sepolia
              </button>
            )}
          </div>
        </div>
        {statusBar && (
          <div className={`border-t border-green-100`}> 
            <div className={`max-w-7xl mx-auto px-6 py-2 text-sm ${statusBar.color}`}>⚙️ {statusBar.text}</div>
          </div>
        )}
      </nav>

      {/* 主内容区 */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* 中心地球动画与标题 */}
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-block animate-float">
            <div className="text-9xl drop-shadow-2xl">🌍</div>
          </div>

          <h1 className="text-5xl font-bold text-gray-800 leading-tight">
            让每一次小改变
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              都被世界看见
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            记录你的环保行为，让贡献永久保存在区块链上。加入我们，一起守护地球家园。
          </p>

          {/* CTA 按钮 */}
          <div className="flex gap-4 justify-center pt-8">
            <Link
              href="/record"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                🌱 立即记录环保行为
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
          </div>

          {/* 数据展示卡片 */}
          <div className="grid grid-cols-3 gap-6 pt-16 max-w-3xl mx-auto">
            {[
              { icon: "📊", label: "全球环保记录", value: "10,234" },
              { icon: "💚", label: "累计减排 (kg)", value: "52,891" },
              { icon: "👥", label: "参与用户", value: "1,523" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-green-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部动态文字 */}
        <div className="text-center pt-20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-gray-500 italic">
            "The future depends on what we do in the present."
            <br />
            <span className="text-sm">— Mahatma Gandhi</span>
          </p>
        </div>
      </div>
    </main>
  );
}
