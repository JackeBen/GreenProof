"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Contract } from "ethers";
import { useGreenProof } from "@/hooks/useGreenProof";
import GreenBadgeNFTABI from "@/abi/GreenBadgeNFTABI.json" assert { type: "json" };

export default function BadgesPage() {
  const { contract, signer, address } = useGreenProof();

  const [count, setCount] = useState<number>(0);
  const [owned, setOwned] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!contract || !address) return;
      try {
        const c = await contract.userActionCount(address);
        setCount(Number(c));
        const badgeAddr: string = await contract.badge();
        if (badgeAddr) {
          const runner = (contract as any).runner as any; // signer or provider
          const badgeContract = new Contract(badgeAddr, GreenBadgeNFTABI as any, runner);
          const [h1, h2, h3] = await Promise.all([
            badgeContract.hasLevel(address, 1),
            badgeContract.hasLevel(address, 2),
            badgeContract.hasLevel(address, 3),
          ]);
          setOwned({ 1: Boolean(h1), 2: Boolean(h2), 3: Boolean(h3) });
        }
      } catch (_) {}
    })();
  }, [contract, address]);

  const canClaimLv1 = count >= 1 && !owned[1];
  const canClaimLv2 = count >= 20 && !owned[2];

  const claim = async (level: 1 | 2 | 3) => {
    if (!contract) return;
    try {
      setLoading(true);
      setStatus("正在领取...");
      const tx = await contract.mintBadge(level);
      await tx.wait();
      setStatus("领取成功");
      // 领取完成后刷新链上持有状态与计数
      try {
        const badgeAddr: string = await contract.badge();
        const runner = (contract as any).runner as any;
        const badgeContract = new Contract(badgeAddr, GreenBadgeNFTABI as any, runner);
        const [h1, h2, h3] = await Promise.all([
          badgeContract.hasLevel(address, 1),
          badgeContract.hasLevel(address, 2),
          badgeContract.hasLevel(address, 3),
        ]);
        setOwned({ 1: Boolean(h1), 2: Boolean(h2), 3: Boolean(h3) });
      } catch (_) {}
    } catch (e: any) {
      setStatus(`领取失败：${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const badges = [
    {
      level: 1,
      name: "环保新芽",
      icon: "🌱",
      condition: "完成 1 次环保记录",
      owned: owned[1] === true,
      claimable: canClaimLv1,
      color: "from-green-400 to-green-600",
      glow: "shadow-green-500/50",
    },
    {
      level: 2,
      name: "绿色践行者",
      icon: "🌿",
      condition: "完成 20 次环保记录",
      owned: owned[2] === true,
      claimable: canClaimLv2,
      color: "from-emerald-400 to-emerald-600",
      glow: "shadow-emerald-500/50",
    },
    {
      level: 3,
      name: "地球守护者",
      icon: "🌍",
      condition: "累计贡献值超过 100 kg",
      owned: owned[3] === true,
      claimable: false,
      color: "from-blue-400 to-blue-600",
      glow: "shadow-blue-500/50",
    },
  ];

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

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-6xl mb-4 animate-float">🎖️</div>
          <h2 className="text-4xl font-bold text-gray-800">环保徽章</h2>
          <p className="text-gray-600">记录你的环保成就</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">徽章收集进度</h3>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {badges.filter((b) => b.owned).length} / {badges.length}
              </div>
              <div className="text-sm text-gray-500">已解锁</div>
            </div>
          </div>

          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000"
              style={{ width: `${(badges.filter((b) => b.owned).length / badges.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <div
              key={i}
              className={`relative group animate-slide-up ${
                badge.owned ? "" : badge.claimable ? "" : "grayscale opacity-60"
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${
                  badge.owned ? `hover:scale-105 ${badge.glow}` : badge.claimable ? "hover:scale-105" : ""
                }`}
              >
                <div className="relative mb-6">
                  <div className={`text-8xl text-center animate-float ${badge.owned ? "" : badge.claimable ? "" : "grayscale"}`}>
                    {badge.icon}
                  </div>
                  {badge.owned && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${badge.color} opacity-20 blur-3xl animate-pulse`}></div>
                  )}
                  {badge.owned && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ✓ 已解锁
                    </div>
                  )}
                  {!badge.owned && badge.claimable && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      可领取
                    </div>
                  )}
                  {!badge.owned && !badge.claimable && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-gray-900/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm">
                        🔒 未解锁
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-3">
                  <div className={`text-2xl font-bold bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}>
                    {badge.name}
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-4 py-2">{badge.condition}</div>

                  {badge.claimable && !badge.owned && (
                    <button
                      className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                      disabled={loading}
                      onClick={() => claim(badge.level as 1 | 2 | 3)}
                    >
                      领取徽章
                    </button>
                  )}

                  {badge.owned && (
                    <div className="pt-4">
                      <a
                        href="#"
                        className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition"
                      >
                        查看 NFT 详情
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {badge.owned && (
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${badge.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none blur-xl`}></div>
              )}
            </div>
          ))}
        </div>

        {status && (
          <div className="text-center text-sm text-blue-700">{status}</div>
        )}

        <div className="text-center">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
