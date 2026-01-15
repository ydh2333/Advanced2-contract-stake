const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("账户地址:", signer.address);
  
  // 获取当前 nonce 状态
  const currentNonce = await ethers.provider.getTransactionCount(signer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(signer.address, "pending");
  
  console.log("已确认的 nonce:", currentNonce);
  console.log("待处理的 nonce:", pendingNonce);
  
  if (pendingNonce === currentNonce) {
    console.log("✅ 没有待处理的交易！");
    return;
  }
  
  console.log("\n发现", pendingNonce - currentNonce, "个待处理交易");
  console.log("准备取消 nonce", currentNonce, "的交易...\n");
  
  try {
    // 获取当前网络的 gas price
    const feeData = await ethers.provider.getFeeData();
    const currentGasPrice = feeData.gasPrice;
    
    console.log("当前网络 gas price:", ethers.formatUnits(currentGasPrice, "gwei"), "Gwei");
    
    // 使用更高的 gas price 来确保能替换待处理的交易
    // 需要比原交易至少高 10%，我们使用 3 倍来确保成功
    const minGasPrice = ethers.parseUnits("60", "gwei"); // 至少 60 Gwei
    const cancelGasPrice = currentGasPrice * 300n / 100n; // 3倍当前价格
    const finalGasPrice = cancelGasPrice > minGasPrice ? cancelGasPrice : minGasPrice;
    
    console.log("取消交易使用的 gas price:", ethers.formatUnits(finalGasPrice, "gwei"), "Gwei");
    console.log("\n发送取消交易...");
    
    // 发送 0 ETH 给自己，使用相同的 nonce 但更高的 gas price
    const cancelTx = await signer.sendTransaction({
      to: signer.address,
      value: 0,
      nonce: currentNonce,
      gasPrice: finalGasPrice,
      gasLimit: 21000, // 标准转账的 gas limit
    });
    
    console.log("取消交易已发送!");
    console.log("交易 hash:", cancelTx.hash);
    console.log("在 Etherscan 上查看: https://sepolia.etherscan.io/tx/" + cancelTx.hash);
    console.log("\n等待交易确认...");
    
    const receipt = await cancelTx.wait(1);
    
    console.log("\n✅ 交易已取消成功!");
    console.log("区块号:", receipt.blockNumber);
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 再次检查 nonce
    const newCurrentNonce = await ethers.provider.getTransactionCount(signer.address, "latest");
    const newPendingNonce = await ethers.provider.getTransactionCount(signer.address, "pending");
    
    console.log("\n当前状态:");
    console.log("已确认的 nonce:", newCurrentNonce);
    console.log("待处理的 nonce:", newPendingNonce);
    
    if (newPendingNonce === newCurrentNonce) {
      console.log("✅ 所有交易已清理完成！");
    } else {
      console.log("⚠️  还有", newPendingNonce - newCurrentNonce, "个交易待处理");
      console.log("你可以再次运行此脚本来取消它们");
    }
    
  } catch (error) {
    console.error("\n❌ 取消交易失败:");
    console.error(error.message);
    
    console.log("\n其他解决方案:");
    console.log("1. 再次运行此脚本，使用更高的 gas price");
    console.log("2. 在 MetaMask 中手动取消交易");
    console.log("3. 等待交易自然过期（通常 24-48 小时）");
    console.log("4. 使用 Etherscan 的取消功能: https://sepolia.etherscan.io/address/" + signer.address);
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

