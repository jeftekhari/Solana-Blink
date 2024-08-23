import cors from "cors";
import express from "express";
import path from "path";
import {
  type ActionPostResponse,
  createPostResponse,
  type ActionGetResponse,
  type ActionsJson,
  createActionHeaders,
  MEMO_PROGRAM_ID,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { DEFAULT_MSG_SIGN, getCreator } from "./constants";
import { routeLogger } from "./middleware";
import { creatorPage } from "./templates/obsCreator";

const app = express();
const port = process.env.PORT || 3000;
const origin = process.env.ORIGIN || `http://localhost:${port}`;
// create the standard headers for this route (including CORS)
const headers = Object.values(createActionHeaders());

app.use(routeLogger);
app.use(
  cors({
    origin: "*", // update to fqdn in prod
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, ".", "static")));
app.get("/", (_, res) => res.redirect("/static/"));
// required for CORS
app.options("/actions.json", (_, res) => {
  res.set(headers);
  res.send();
});
app.get("/actions.json", (_, res) => {
  const payload: ActionsJson = {
    rules: [
      // map all root level routes to an action
      {
        pathPattern: "/*",
        apiPath: "/donate/*",
      },
      // idempotent rule as the fallback
      {
        pathPattern: "/donate/**",
        apiPath: "/donate/**",
      },
    ],
  };
  res.set(headers);
  res.send(payload);
});
// required for CORS
app.options("/donate/:wallet", (_, res) => {
  console.error(`${headers}`);
  res.set(headers);
  res.send();
});
app.get("/donate/:wallet", (req, res) => {
  const { wallet } = req.params;
  const donateUrl = `/donate/${wallet}`;
  console.error(req.params);
  const creator = getCreator(wallet);
  if (!creator) return res.status(400).send("Wallet not in database");
  const payload: ActionGetResponse = {
    title: "Tip Your Favorite Streamer!",
    icon: `${origin}/static/img/${creator.icon}`,
    description: creator.description,
    label: "Transfer", // this value will be ignored since `links.actions` exists
    links: {
      actions: [
        {
          label: "Send .01 SOL", // button text
          href: `${donateUrl}?amount=${".01"}`,
        },
        {
          label: "Send .1 SOL", // button text
          href: `${donateUrl}?amount=${".1"}`,
        },
        {
          label: "Send .2 SOL", // button text
          href: `${donateUrl}?amount=${".2"}`,
        },
        {
          label: `Tip ${creator.name} with SOL!`, // button text
          href: `${donateUrl}?amount={amount}&message={message}`, // this href will have a text input
          parameters: [
            {
              name: "amount", // parameter name in the `href` above
              label: "Enter the amount of SOL to tip", // placeholder of the text input
              required: true,
            },
            {
              name: "message", // parameter name in the `href` above
              label: "Enter Message to the streamer", // placeholder of the text input
              required: true,
            },
          ],
        },
      ],
    },
  };
  res.set(headers);
  res.send(payload);
});
app.post("/donate/:wallet", async (req, res) => {
  const { wallet } = req.params;
  let { amount, message } = req.query;
  const { account } = req.body;

  // validate params
  if (!amount) return res.status(401).send("Missing params");
  const parsedAmount = parseFloat(`${amount}`);
  if (!parsedAmount || parsedAmount <= 0)
    return res.status(400).send("Amount is too small");
  if (!message) console.warn("Empty message, should be fine?");

  let receiver: PublicKey;
  let sender: PublicKey;
  try {
    receiver = new PublicKey(wallet);
    sender = new PublicKey(account);
  } catch (e) {
    return res.status(400).send("Check wallet and account are valid addresses");
  }

  try {
    const conn = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("mainnet-beta"),
    );
    // ensure the receiving account will be rent exempt
    const minimumBalance = await conn.getMinimumBalanceForRentExemption(
      0, // note: simple accounts that just store native SOL have `0` bytes of data
    );

    // re-enable this when changing from lamports to pure sol

    // if (amount * LAMPORTS_PER_SOL < minimumBalance) {
    //   throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
    // }
    console.log(`${parsedAmount}`);
    // create an instruction to transfer native SOL from one wallet to another
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: receiver,
      lamports: parsedAmount * LAMPORTS_PER_SOL,
    });

    // console.log(transferSolInstruction);

    // get the latest blockhash amd block height
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();

    // create a legacy transaction
    const transaction = new Transaction({
      feePayer: sender,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

    transaction.add(
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(`${DEFAULT_MSG_SIGN + message}`, "utf8"),
        keys: [],
      }),
    );

    // console.log(transaction);
    // versioned transactions are also supported
    // const transaction = new VersionedTransaction(
    //   new TransactionMessage({
    //     payerKey: sender,
    //     recentBlockhash: blockhash,
    //     instructions: [transferSolInstruction],
    //   }).compileToV0Message(),
    //   // note: you can also use `compileToLegacyMessage`
    // );

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Send ${amount} SOL to ${receiver.toBase58()}`,
      },
      // note: no additional signers are needed
      // signers: [],
    });

    console.debug(payload);

    res.set(headers);
    return res.send(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server Error, check logs");
  }
});

app.get("/obs/", (req, res) => {
  res.send(`${creatorPage(req.query.walletAddress as string)}`);
});

app.listen(port, () =>
  console.warn(
    `Successful start up at :${port} open up localhost:${port}/static into OBS`,
  ),
);
