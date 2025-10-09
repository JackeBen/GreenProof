"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGreenProof } from "@/hooks/useGreenProof";
import { hexlify, isHexString } from "ethers";
import { loadOrSignDecryptionSignature, clearDecryptionSignatureCache } from "@/lib/fheDecryptionSignature";

export default function MePage() {
  const { contract, fhevmInstance, signer, address, isConnected } = useGreenProof();
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<Array<{ timestamp: number; category: string; description: string; value: any }>>([]);
  const [sumCipher, setSumCipher] = useState<any>(null);
  const [sumPlain, setSumPlain] = useState<number | null>(null);
  const [decStatus, setDecStatus] = useState<string>("");
  const [decLoading, setDecLoading] = useState<boolean>(false);
  const [listDecLoading, setListDecLoading] = useState<boolean>(false);
  const [listDecStatus, setListDecStatus] = useState<string>("");
  const [decryptedMap, setDecryptedMap] = useState<Record<string, number>>({});
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!contract || !address) return;
      setLoading(true);
      try {
        const acts = await contract.getUserActions(address);
        setActions(acts);
        const sum = await contract.getUserEncryptedSum(address);
        const sumHex = typeof sum === "string" ? sum : (isHexString(sum) ? (sum as any) : hexlify(sum as any));
        setSumCipher(sumHex);
      } catch (_) {}
      setLoading(false);
    }
    load();
  }, [contract, address]);

  const totalActions = actions.length;
  // ethers v6 返回的 Result 数组是只读代理，避免原地 reverse
  const recent = (Array as any).from(actions).toReversed ? (Array as any).from(actions).toReversed() : Array.from(actions as any[]).reverse();

  return (
    <>
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

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-800">我的环保足迹</h2>
          <p className="text-gray-600">记录你对地球的每一份贡献</p>
        </div>

        {/* 数据概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">📊</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{totalActions}</div>
                <div className="text-sm text-gray-600 mt-1">总行为次数</div>
              </div>
            </div>
            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-green-600 w-3/4"></div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">💚</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{sumPlain ?? "•••"}</div>
                <div className="text-sm text-gray-600 mt-1">累计贡献 (kg CO₂)</div>
              </div>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-2/3"></div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl">🏆</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-600">--</div>
                <div className="text-sm text-gray-600 mt-1">获得徽章数</div>
              </div>
            </div>
            <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 w-1/2"></div>
            </div>
          </div>
        </div>

        {/* 行为记录列表 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">环保记录</h3>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                onClick={() => {
                  // 仅重新读取列表
                  setDecryptedMap({});
                  (async () => {
                    if (!contract || !address) return;
                    try {
                      const acts = await contract.getUserActions(address);
                      setActions(acts);
                    } catch {}
                  })();
                }}
              >
                🔄 刷新
              </button>
              <button
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                disabled={!fhevmInstance || !signer || !contract || actions.length === 0 || listDecLoading}
                onClick={async () => {
                  if (!fhevmInstance || !signer || !contract || actions.length === 0) return;
                  try {
                    setListDecLoading(true);
                    setListDecStatus("正在解密所有记录...");
                    const caddr = (contract as any)?.target ?? (contract as any)?.address;
                    const handles = Array.from(
                      new Set(
                        actions.map((a: any) =>
                          typeof a.value === "string"
                            ? a.value
                            : isHexString(a.value as any)
                              ? (a.value as any)
                              : hexlify(a.value as any)
                        )
                      )
                    );

                    const sig = await loadOrSignDecryptionSignature(
                      fhevmInstance,
                      [caddr],
                      signer
                    );

                    const payload = handles.map((h) => ({ handle: h, contractAddress: caddr }));
                    const res = await fhevmInstance.userDecrypt(
                      payload,
                      sig.privateKey,
                      sig.publicKey,
                      sig.signature,
                      sig.contractAddresses,
                      sig.userAddress,
                      sig.startTimestamp,
                      sig.durationDays
                    );

                    const next: Record<string, number> = {};
                    for (const h of handles) {
                      const v = res?.[h];
                      const n = Number(v);
                      if (!Number.isNaN(n)) next[h] = n;
                    }
                    setDecryptedMap(next);
                    setListDecStatus("");
                  } catch (e: any) {
                    console.error("decrypt list error", e);
                    setListDecStatus(`解密失败：${e?.message || e}`);
                  } finally {
                    setListDecLoading(false);
                  }
                }}
              >
                🔓 解密所有记录
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recent.map((a: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🌱</div>
                  <div>
                    <div className="font-semibold text-gray-800">{a.category}</div>
                    <div className="text-sm text-gray-500">{new Date(Number(a.timestamp) * 1000).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {(() => {
                      const h = typeof a.value === "string"
                        ? a.value
                        : isHexString(a.value as any)
                          ? (a.value as any)
                          : hexlify(a.value as any);
                      const val = decryptedMap[h];
                      return (
                        <div className="font-bold text-green-600">
                          {val === undefined ? "加密" : `明文：${val}`}
                        </div>
                      );
                    })()}
                  </div>
                  <button
                    className="px-3 py-1 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    onClick={async () => {
                      const h = typeof a.value === "string"
                        ? a.value
                        : isHexString(a.value as any)
                          ? (a.value as any)
                          : hexlify(a.value as any);
                      let n = decryptedMap[h];
                      if (n === undefined && fhevmInstance && signer && contract) {
                        try {
                          setDecStatus("正在解密详情...");
                          const caddr = (contract as any)?.target ?? (contract as any)?.address;
                          const sig = await loadOrSignDecryptionSignature(
                            fhevmInstance,
                            [caddr],
                            signer
                          );
                          const res = await fhevmInstance.userDecrypt(
                            [{ handle: h, contractAddress: caddr }],
                            sig.privateKey,
                            sig.publicKey,
                            sig.signature,
                            sig.contractAddresses,
                            sig.userAddress,
                            sig.startTimestamp,
                            sig.durationDays
                          );
                          n = Number(res?.[h]);
                          if (!Number.isNaN(n)) {
                            setDecryptedMap((prev) => ({ ...prev, [h]: n! }));
                          }
                        } catch (e) {
                          console.error("decrypt detail error", e);
                        } finally {
                          setDecStatus("");
                        }
                      }
                      setDetailData({
                        category: a.category,
                        description: a.description,
                        timestamp: a.timestamp,
                        handle: h,
                        clear: n,
                      });
                      setDetailOpen(true);
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
          {listDecStatus && (
            <div className="mt-2 text-sm text-blue-700">{listDecStatus}</div>
          )}
        </div>

        {/* 解密按钮 */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <button
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
            disabled={!fhevmInstance || sumCipher === null}
            onClick={async () => {
              if (!fhevmInstance || sumCipher === null) return;
              try {
                setDecLoading(true);
                setDecStatus("正在解密...");
                const cipher = typeof sumCipher === "string"
                  ? sumCipher
                  : isHexString(sumCipher as any)
                    ? (sumCipher as any)
                    : hexlify(sumCipher as any);
                const caddr = (contract as any)?.target ?? (contract as any)?.address;
                let clearNum: number | undefined;
                try {
                  // 使用签名方式进行解密（新 SDK 推荐）
                  if (signer && caddr) {
                    const sig = await loadOrSignDecryptionSignature(
                      fhevmInstance,
                      [caddr],
                      signer
                    );
                    const res = await fhevmInstance.userDecrypt(
                      [{ handle: cipher, contractAddress: caddr }],
                      sig.privateKey,
                      sig.publicKey,
                      sig.signature,
                      sig.contractAddresses,
                      sig.userAddress,
                      sig.startTimestamp,
                      sig.durationDays
                    );
                    const key = (typeof cipher === "string" ? cipher : String(cipher)) as string;
                    const value = res?.[key] ?? res?.[Object.keys(res ?? {})[0]];
                    clearNum = Number(value);
                  }
                } catch (eSig) {
                  // 回退到旧接口（有些版本允许直接 userDecrypt(handle) 或 decrypt(contract, handle)）
                  try {
                    const val = await fhevmInstance.userDecrypt(cipher);
                    clearNum = Number(val);
                  } catch (e1) {
                    if (typeof fhevmInstance.decrypt === "function") {
                      const val2 = caddr
                        ? await fhevmInstance.decrypt(caddr, cipher)
                        : await fhevmInstance.decrypt(cipher);
                      clearNum = Number(val2);
                    } else {
                      throw e1;
                    }
                  }
                }
                setSumPlain(!clearNum || isNaN(clearNum) ? 0 : clearNum);
                setDecStatus("");
              } catch (e: any) {
                console.error("decrypt error", e);
                setDecStatus(`解密失败：${e?.message || e}`);
              } finally {
                setDecLoading(false);
              }
            }}
          >
            🔓 解密我的累计贡献
          </button>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={async () => {
                if (!fhevmInstance || !signer || !contract) return;
                const caddr = (contract as any)?.target ?? (contract as any)?.address;
                if (!caddr) return;
                await clearDecryptionSignatureCache(fhevmInstance, [caddr], signer);
                setDecStatus("已清除授权缓存，下次解密会重新签名");
              }}
            >
              清除授权缓存/重新签名
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">贡献值已加密存储，点击解密查看真实数值</p>
          {decStatus && (
            <div className="mt-2 text-sm text-blue-700">{decStatus}</div>
          )}
        </div>

        {/* 返回按钮 */}
        <div className="text-center">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
    {detailOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-800">记录详情</h4>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setDetailOpen(false)}>✕</button>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div><span className="font-medium">类型：</span>{detailData?.category}</div>
            <div><span className="font-medium">时间：</span>{detailData?.timestamp ? new Date(Number(detailData.timestamp) * 1000).toLocaleString() : "-"}</div>
            <div><span className="font-medium">描述：</span>{detailData?.description || "-"}</div>
            <div className="break-all"><span className="font-medium">句柄：</span>{detailData?.handle}</div>
            <div><span className="font-medium">明文：</span>{detailData?.clear !== undefined ? String(detailData.clear) : "未解密/无数据"}</div>
          </div>
          <div className="mt-4 text-right">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => setDetailOpen(false)}>关闭</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
