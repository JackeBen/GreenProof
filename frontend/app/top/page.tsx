"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGreenProof } from "@/hooks/useGreenProof";

export default function TopPage() {
  const { contract } = useGreenProof();
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<Array<{ address: string; count: number }>>([]);

  useEffect(() => {
    (async () => {
      if (!contract) return;
      try {
        setLoading(true);
        const addrs: string[] = await contract.getTopUsers(20);
        const pairs: Array<{ address: string; count: number }> = [];
        for (const a of addrs) {
          try {
            const c = await contract.userActionCount(a);
            const n = Number(c);
            if (n > 0) pairs.push({ address: a, count: n });
          } catch {}
        }
        pairs.sort((x, y) => y.count - x.count);
        setRows(pairs.slice(0, 10));
      } finally {
        setLoading(false);
      }
    })();
  }, [contract]);

  const sortedData = useMemo(() => {
    return rows.map((r, idx) => ({
      rank: idx + 1,
      address: `${r.address.slice(0, 6)}...${r.address.slice(-4)}`,
      count: r.count,
      contribution: 0,
      badge: idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "",
    }));
  }, [rows]);

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

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-6xl mb-4 animate-float">🏆</div>
          <h2 className="text-4xl font-bold text-gray-800">环保达人排行榜</h2>
          <p className="text-gray-600">致敬每一位地球守护者</p>
        </div>

        {/* 次数榜，无切换 */}

        {/* 排行榜列表 */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {(loading ? Array.from({ length: 5 }).map((_, i) => ({ rank: i + 1, address: "加载中...", count: 0, contribution: 0, badge: "" })) : sortedData).map((user, i) => {
            const isTop3 = user.rank <= 3;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group ${
                  isTop3
                    ? "bg-gradient-to-r from-yellow-50 via-white to-yellow-50 border-2 border-yellow-300"
                    : "bg-white/90 backdrop-blur-sm"
                }`}
              >
                {/* 排名 */}
                <div className="flex items-center gap-6">
                  <div
                    className={`text-3xl font-bold ${
                      isTop3 ? "text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text" : "text-gray-400"
                    }`}
                  >
                    #{user.rank}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex items-center gap-3">
                    {user.badge && <span className="text-4xl">{user.badge}</span>}
                    <div>
                      <div className="font-mono font-semibold text-gray-800">{user.address}</div>
                      <div className="text-sm text-gray-500 flex gap-3 mt-1">
                        <span>📊 {user.count} 次</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 数值展示 */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{user.count}</div>
                  <div className="text-sm text-gray-500">环保次数</div>
                </div>

                {/* hover 效果光晕 */}
                {isTop3 && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/0 via-yellow-200/20 to-yellow-200/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* 提示信息 */}
        <div className="text-center text-gray-500 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
          💡 数据每 10 分钟更新一次 | 基于链上真实记录
        </div>

        {/* 返回按钮 */}
        <div className="text-center">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
