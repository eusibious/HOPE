import { ethers } from "ethers";
import HOPEFactory from "../abi/HOPEFactory.json";

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

export const getFactoryContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  if (!FACTORY_ADDRESS) {
    throw new Error("Factory address not set in .env");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(FACTORY_ADDRESS, HOPEFactory.abi, signer);
};
