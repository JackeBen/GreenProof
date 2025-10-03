export type FhevmInstance = any;

let __inited = false;

export async function getRelayerInstance(provider: any): Promise<FhevmInstance> {
  // Lazy import UMD bundle-friendly entry
  // Using ESM bundle path to avoid window globals
  const sdk = await import("@zama-fhe/relayer-sdk/bundle");

  if (!__inited) {
    await sdk.initSDK();
    __inited = true;
  }

  const instance = await sdk.createInstance({
    ...sdk.SepoliaConfig,
    network: provider,
  });

  return instance;
}


