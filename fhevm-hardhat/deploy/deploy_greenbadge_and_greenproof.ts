import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log, get } = hre.deployments;
  const { ethers } = hre;

  // 1) Deploy Badge NFT
  const badge = await deploy("GreenBadgeNFT", {
    from: deployer,
    args: ["ipfs://greenproof-badges/"],
    log: true,
  });
  log(`GreenBadgeNFT deployed at ${badge.address}`);

  // 2) Deploy GreenProof with badge address
  const green = await deploy("GreenProof", {
    from: deployer,
    args: [badge.address],
    log: true,
  });
  log(`GreenProof deployed at ${green.address}`);

  // 3) Set GreenProof as minter on Badge
  const badgeContract = await ethers.getContractAt("GreenBadgeNFT", badge.address);
  const tx = await badgeContract.connect(await ethers.getSigner(deployer)).setMinter(green.address, true);
  await tx.wait();
  log(`GreenBadgeNFT.setMinter(${green.address}, true)`);
};

export default func;
func.id = "deploy_greenbadge_and_greenproof";
func.tags = ["GreenBadgeNFT", "GreenProof"];


