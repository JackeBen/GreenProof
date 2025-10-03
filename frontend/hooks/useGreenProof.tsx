"use client";

import { useState, useEffect } from "react";
import { Contract } from "ethers";
import { useWallet } from "./useWallet";
import { loadRelayerSDKUmd } from "@/lib/loadRelayerSDK";
import GreenProofABI from "@/abi/GreenProofABI.json" assert { type: "json" };
import GreenProofAddresses from "@/abi/GreenProofAddresses.json" assert { type: "json" };

// 读取生成的 ABI/地址映射（与 hardhat 部署联动）
const ABI = GreenProofABI as any;
const ADDR_MAP = GreenProofAddresses as any;

export function useGreenProof() {
  const { provider, signer, address, chainId, isConnected } = useWallet();
  const [contract, setContract] = useState<Contract | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [fheStatus, setFheStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [fheError, setFheError] = useState<Error | null>(null);

  // 合约实例
  useEffect(() => {
    if (!signer) { setContract(null); return; }
    // 仅支持 Sepolia；如需本地网络，可扩展地址选择逻辑
    const addr = ADDR_MAP?.sepolia?.address as string | undefined;
    if (!addr) { setContract(null); return; }
    setContract(new Contract(addr, ABI, signer));
  }, [signer]);

  // FHEVM 初始化（仅在 Sepolia 上进行）
  useEffect(() => {
    async function run() {
      if (!isConnected || !chainId) return;
      if (chainId !== 11155111) { // Sepolia
        setFheStatus("error");
        setFheError(new Error("请切换到 Sepolia 网络"));
        setFhevmInstance(null);
        return;
      }
      try {
        setFheStatus("loading");
        setFheError(null);

        // 动态加载 SDK，仅客户端使用
        // 为避免 Next 开发环境中的循环依赖告警与打包差异，这里强制使用 UMD 版本
        const umd = await loadRelayerSDKUmd();
        // 初始化 SDK，确保 relayer 公钥与用户关联密钥加载
        await umd.initSDK();
        const eip1193 = (typeof window !== "undefined" && (window as any).ethereum) || undefined;
        const instance = await umd.createInstance({
          ...umd.SepoliaConfig,
          network: eip1193 ?? provider,
        });

        setFhevmInstance(instance);
        setFheStatus("ready");
      } catch (e: any) {
        // 简单的重试一次
        try {
          const umd = await loadRelayerSDKUmd();
          await umd.initSDK();
          const eip1193 = (typeof window !== "undefined" && (window as any).ethereum) || undefined;
          const instance = await umd.createInstance({
            ...umd.SepoliaConfig,
            network: eip1193 ?? provider,
          });
          setFhevmInstance(instance);
          setFheStatus("ready");
        } catch (err: any) {
          setFheStatus("error");
          setFheError(err);
          setFhevmInstance(null);
        }
      }
    }
    run();
    // 仅在网络或连接状态变化时重试
  }, [isConnected, chainId, provider]);

  return {
    contract,
    fhevmInstance,
    provider,
    signer,
    address,
    isConnected,
    chainId,
    fheStatus,
    fheError,
  };
}

