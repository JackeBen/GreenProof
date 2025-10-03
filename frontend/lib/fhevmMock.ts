import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";

export async function getMockInstance(rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  // NOTE: metadata detection omitted for brevity; user can provide known addrs if needed
  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
    chainId: 31337,
    gatewayChainId: 55815,
    inputVerifierContractAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030",
    kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
    verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  return instance;
}


