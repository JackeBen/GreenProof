"use client";

import { ethers } from "ethers";

export type DecryptionSignature = {
  publicKey: string;
  privateKey: string;
  signature: string;
  contractAddresses: `0x${string}`[];
  userAddress: `0x${string}`;
  startTimestamp: number;
  durationDays: number;
};

function nowTs(): number {
  return Math.floor(Date.now() / 1000);
}

function buildStorageKey(instance: any, contractAddresses: string[], userAddress: string) {
  const sorted = (contractAddresses as `0x${string}`[]).slice().sort();
  const empty = instance.createEIP712(ethers.ZeroAddress, sorted, 0, 0);
  const hash = ethers.TypedDataEncoder.hash(
    empty.domain,
    { UserDecryptRequestVerification: empty.types.UserDecryptRequestVerification },
    empty.message
  );
  return `${userAddress}:${hash}`;
}

export async function loadOrSignDecryptionSignature(
  instance: any,
  contractAddresses: `0x${string}`[],
  signer: ethers.Signer,
  options?: { storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">; forceResign?: boolean }
): Promise<DecryptionSignature> {
  const storage = options?.storage ?? (typeof window !== "undefined" ? window.localStorage : ({} as any));
  const userAddress = (await signer.getAddress()) as `0x${string}`;
  const storageKey = buildStorageKey(instance, contractAddresses, userAddress);

  try {
    if (options?.forceResign && typeof storage.removeItem === "function") {
      storage.removeItem(storageKey);
    }
    const cached = storage.getItem(storageKey);
    if (cached) {
      const parsed: DecryptionSignature = JSON.parse(cached);
      if (
        parsed &&
        typeof parsed.publicKey === "string" &&
        typeof parsed.privateKey === "string" &&
        typeof parsed.signature === "string"
      ) {
        return parsed;
      }
    }
  } catch {}

  const sorted = contractAddresses.slice().sort() as `0x${string}`[];
  const { publicKey, privateKey } = instance.generateKeypair();
  const startTimestamp = nowTs();
  const durationDays = 365;
  const eip712 = instance.createEIP712(publicKey, sorted, startTimestamp, durationDays);
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  const result: DecryptionSignature = {
    publicKey,
    privateKey,
    signature,
    contractAddresses: sorted,
    userAddress,
    startTimestamp,
    durationDays,
  };

  try {
    storage.setItem(storageKey, JSON.stringify(result));
  } catch {}

  return result;
}

export async function clearDecryptionSignatureCache(
  instance: any,
  contractAddresses: `0x${string}`[],
  signer: ethers.Signer,
  storage: Pick<Storage, "removeItem"> = typeof window !== "undefined" ? window.localStorage : ({} as any)
): Promise<void> {
  try {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const storageKey = buildStorageKey(instance, contractAddresses, userAddress);
    if (typeof storage.removeItem === "function") storage.removeItem(storageKey);
  } catch {}
}


