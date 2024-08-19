import { PublicKey } from "@solana/web3.js";
import type { Creator } from "./types";

export const DEFAULT_SOL_ADDRESS: PublicKey = new PublicKey(
  "CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa", // mainnet wallet
);

export const DEFAULT_SOL_AMOUNT: number = 0.000000001;

export const DEFAULT_MSG_SIGN: string = "twinkMemo: ";

// TODO: move to redis
let creators = new Map();

export const getCreator = (c: string) => creators.get(c);

creators.set("CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa", {
  name: "ManBoy",
  icon: "ManBoy.png",
  description: "Tipping Manboy",
} as Creator);

creators.set("5pfePMxmcjneFrfhqdArRNQtbMqbFWofPegSbcwvT7km", {
  name: "seslly",
  icon: "seslly.png",
  description: "GIVE ME YOUR MONEY"
} as Creator)