"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum) {
      alert("请安装 MetaMask");
      return;
    }

    try {
      const ethProvider = new BrowserProvider(ethereum);
      await ethereum.request?.({ method: "eth_requestAccounts" });
      const ethSigner = await ethProvider.getSigner();
      const ethAddress = await ethSigner.getAddress();
      const network = await ethProvider.getNetwork();

      setProvider(ethProvider);
      setSigner(ethSigner);
      setAddress(ethAddress);
      setChainId(Number(network.chainId));
      setIsConnected(true);
    } catch (error) {
      console.error("连接钱包失败:", error);
    }
  };

  useEffect(() => {
    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum) return;

    const ethProvider = new BrowserProvider(ethereum);
    setProvider(ethProvider);

    // 冷启动静默连接（如果已授权）
    (async () => {
      try {
        const accounts: string[] = await ethereum.request?.({ method: "eth_accounts" });
        const chainHex: string = await ethereum.request?.({ method: "eth_chainId" });
        const currentChainId = chainHex ? parseInt(chainHex, 16) : NaN;
        setChainId(currentChainId);
        if (accounts && accounts.length > 0) {
          const ethSigner = await ethProvider.getSigner();
          setSigner(ethSigner);
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (_) {}
    })();

    // 监听账户/网络变化，更新状态
    const onAccounts = async (accs: string[]) => {
      if (!accs || accs.length === 0) {
        setIsConnected(false);
        setSigner(null);
        setAddress("");
        return;
      }
      try {
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner);
        setAddress(accs[0]);
        setIsConnected(true);
      } catch (_) {}
    };
    const onChain = (hexId: string) => {
      try { setChainId(parseInt(hexId, 16)); } catch { setChainId(null); }
    };
    ethereum?.on?.("accountsChanged", onAccounts);
    ethereum?.on?.("chainChanged", onChain);

    return () => {
      try {
        ethereum?.removeListener?.("accountsChanged", onAccounts);
        ethereum?.removeListener?.("chainChanged", onChain);
      } catch (_) {}
    };
  }, []);

  const switchToSepolia = async () => {
    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum) return;
    try {
      await ethereum.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized chain ID")) {
        try {
          await ethereum.request?.({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (_) {}
      }
    }
  };

  return { provider, signer, address, chainId, isConnected, connect, switchToSepolia };
}

