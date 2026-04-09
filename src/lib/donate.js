import { ethers } from "ethers"
import { getSigner } from "./web3"
import { campaignABI } from "./contract"   //from where?

export const donateToCampaign = async (address, amountEth) => {
  try {
    const signer = await getSigner()

    const contract = new ethers.Contract(address, campaignABI, signer)

    const tx = await contract.donate({
      value: ethers.parseEther(amountEth)
    })

    console.log("⏳ TX Sent:", tx.hash)

    await tx.wait()

    console.log("✅ Donation successful")

    return true
  } catch (err) {
    console.error("❌ Donation failed:", err)
    throw err
  }
}
