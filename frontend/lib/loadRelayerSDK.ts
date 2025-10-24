export type RelayerSDKUmd = {
  initSDK: (options?: unknown) => Promise<void | boolean>;
  createInstance: (config: any) => Promise<any>;
  SepoliaConfig: any;
};

const CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

declare global {
  interface Window {
    relayerSDK?: RelayerSDKUmd & { __initialized__?: boolean };
  }
}

export async function loadRelayerSDKUmd(): Promise<RelayerSDKUmd> {
  if (typeof window === "undefined") throw new Error("No window");

  if (window.relayerSDK) return window.relayerSDK as RelayerSDKUmd;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CDN_URL;
    s.async = true;
    s.type = "text/javascript";
    s.onload = () => {
      if (!window.relayerSDK || typeof window.relayerSDK.createInstance !== "function") {
        reject(new Error("relayerSDK UMD not available"));
        return;
      }
      resolve();
    };
    s.onerror = () => reject(new Error("Failed to load relayer SDK UMD"));
    document.head.appendChild(s);
  });

  return window.relayerSDK as RelayerSDKUmd;
}


