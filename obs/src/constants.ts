import { PublicKey } from "@solana/web3.js";
import type { Creator } from "./types";

export const DEFAULT_SOL_ADDRESS: PublicKey = new PublicKey(
  "CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa", // mainnet wallet
);

export const DEFAULT_SOL_AMOUNT: number = 0.000000001;

export const DEFAULT_MSG_SIGN: string = "twinkMemo: ";

// TODO: move to redis
let creators = new Map<string, Creator>();
export { creators };

export const getCreator = (username: string): Creator | undefined =>
  creators.get(username);

creators.set("ManBoy", {
  name: "ManBoy",
  twitter: "JoeEftah",
  icon: "ManBoy.png",
  description: "Tipping Manboy",
  walletAddress: "CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa",
});

// TODO: fix this
export const addCreator = (newCreator: Creator) => {
  if (creators.has(newCreator.name)) {
    throw new Error("Creator with this name already exists");
  }
  creators.set(newCreator.name, newCreator);
};
