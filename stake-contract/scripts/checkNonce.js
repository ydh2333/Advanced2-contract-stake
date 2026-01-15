const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("账户地址:", signer.address);
  
  // 获取当前 nonce 状态
  const currentNonce = await ethers.provider.getTransactionCount(signer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(signer.address, "pending");
  
  console.log("\n当前 nonce 状态:");
  console.log("已确认的 nonce:", currentNonce);
  console.log("待处理的 nonce:", pendingNonce);
  
  if (pendingNonce === currentNonce) {
    console.log("\n✅ 状态正常！没有待处理的交易");
    console.log("你现在可以正常发送交易了");
  } else {
    console.log("\n⚠️  还有", pendingNonce - currentNonce, "个交易待处理");
  }
  
  // 获取余额
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("\n账户余额:", ethers.formatEther(balance), "ETH");
  
  console.log("\nEtherscan 链接: https://sepolia.etherscan.io/address/" + signer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

