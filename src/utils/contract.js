import { ethers } from "ethers";

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

const FACTORY_ABI = [
  // your ABI here
];

export const getFactoryContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  if (!FACTORY_ADDRESS) {
    throw new Error("Factory address not set in .env");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
};
