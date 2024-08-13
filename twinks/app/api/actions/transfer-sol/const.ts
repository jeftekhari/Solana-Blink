import { PublicKey } from "@solana/web3.js";

export const DEFAULT_SOL_ADDRESS: PublicKey = new PublicKey(
  "CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa", // mainnet wallet
);

export const DEFAULT_SOL_AMOUNT: number = 0.000000001;

export const DEFAULT_MSG_SIGN: string = "twinkMemo: ";