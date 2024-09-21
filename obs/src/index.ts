import express from "express";
import {
  type ActionPostResponse,
  createPostResponse,
  type ActionGetResponse,
  type ActionsJson,
  createActionHeaders,
  MEMO_PROGRAM_ID,
  type NextAction,
  actionCorsMiddleware,
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
import { tags } from "./templates/donatePage";
import { signupPage } from "./templates/signUp";
import { addCreator } from "./constants";
import type { Creator } from "./types";
import { creators } from "./constants";

const app = express();
const port = process.env.PORT || 3000;
const origin = process.env.ORIGIN || `http://localhost:${port}`;
const conn = new Connection(
  process.env.SOLANA_RPC! || clusterApiUrl("mainnet-beta"),
);
const arg = process.argv[2] || "ManBoy";
// Website Stuff
app.use(routeLogger);
app.use(express.static("static")); // use this pattern to serve files or folders

app.get("/obs/", (req, res) => {
  res.send(`${creatorPage(req.query.walletAddress as string)}`);
});
app.get("/robots.txt", (_, res) => {
  res.setHeader("content-type", "text/plain;charset=UTF-8");
  res.send(`# Disallow everything.
  User-agent: *
  Disallow: /

  # Certain social media sites are whitelisted to allow crawlers to access page markup when links to /images are shared. 
  User-agent: Twitterbot
  Allow: /

  User-agent: facebookexternalhit
  Allow: /`);
});

// API stuff
app.use(express.raw({ type: "text/*", limit: "1kb" })); // work around a bug where the json payload callback gets sent as text/plaintext
app.use(actionCorsMiddleware(createActionHeaders())); // set the headers for all routes below, required for actions to work properly
app.use((req, res, next) => {
  if (req.headers["content-type"] === "text/plain;charset=UTF-8") {
    try {
      console.log("we're gonna try to parse");
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.error("could not parse gl");
    }
  }
  next();
});

// parse json payloads and parms into json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/actions.json", (_, res) => {
  const payload: ActionsJson = {
    rules: [
      // map all root level routes to an action
      {
        pathPattern: "/",
        apiPath: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa",
      },
      // idempotent rule as the fallback
      {
        pathPattern: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa",
        apiPath: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa",
      },
    ],
  };
  res.send(payload);
});

app.get("/donate/:wallet", (req, res) => {
  const agent = req.get("User-Agent");
  console.log(agent);
  // if twitter respond with html
  if (agent?.startsWith("Twitterbot")) return res.send(`${tags()}`);

  const { wallet } = req.params;
  const donateUrl = `/donate/${wallet}`;
  const creator = getCreator(wallet);
  if (!creator) return res.status(400).send("Wallet not in database");
  const payload: ActionGetResponse = {
    title: "Tip Your Favorite Streamer!",
    icon: `${origin}/img/${creator.icon}`,
    description: creator.description,
    label: "Transfer", // this value will be ignored since `links.actions` exists
    links: {
      actions: [
        {
          label: `Tip ${creator.name} with SOL!`, // button text
          href: `${donateUrl}?amount={amount}&message={message}`, // this href will have a text input
          parameters: [
            {
              name: "amount", // parameter name in the `href` above
              label: "Enter the amount of SOL to tip", // placeholder of the text input
              type: "number",
              min: 0.001,
              required: true,
            },
            {
              name: "message", // parameter name in the `href` above
              label: "Enter Message to the streamer", // placeholder of the text input
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
  };
  res.send(payload);
});

app.post("/donate/:wallet", async (req, res) => {
  const { wallet } = req.params;
  let { amount, message } = req.query;
  const { account } = req.body;

  // validate params
  if (!amount || !message)
    return res.status(400).send({ error: "Amount and Message required" });
  const parsedAmount = amount === "{amount}" ? 0.001 : parseFloat(`${amount}`);
  if (!parsedAmount || parsedAmount <= 0) {
    console.error(`invalid amount ${amount}`);
    return res.status(400).send("Amount is too small");
  }

  let receiver: PublicKey;
  let sender: PublicKey;
  try {
    receiver = new PublicKey(wallet);
    sender = new PublicKey(account);
  } catch (e) {
    return res.status(400).send("Check wallet and account are valid addresses");
  }

  try {
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
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Send ${amount} SOL to ${receiver.toBase58()}`,
        links: {
          next: { type: "post", href: `/donate/${wallet}/confirmed` },
        },
      },
      // note: no additional signers are needed
      // signers: [],
    });

    // console.debug(payload);

    return res.send(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server Error, check logs");
  }
});
// callback
app.post("/donate/:wallet/confirmed", (req, res) => {
  const { wallet } = req.params;
  const { account, signature } = req.body;
  console.error(account, signature);
  const creator = getCreator(wallet);
  if (!creator) return res.status(400).send("Wallet not in database");

  const nextAction: NextAction = {
    type: "completed",
    icon: `${origin}/img/${creator.icon}`,
    title: "LFGGGGG for real!!",
    description: creator.description,
    label: "Donated!",
  };
  res.send(nextAction);
});

app.get("/profiles/:username", (req, res) => {
  const { username } = req.params;
  const creator = getCreator(username);
  if (!creator) {
    return res.status(404).send("Creator not found");
  }
  res.setHeader("Content-Type", "text/html");
  res.type(".html");
  res.send(`${tags(creator)}`);
});

app.listen(port, () =>
  console.warn(
    `Successful start up at :${port} open up localhost:${port} into OBS`,
  ),
);

app.get("/signup", (_, res) => {
  res.setHeader("Content-Type", "text/html");
  res.type(".html");
  res.send(`${signupPage()}`);
});

app.post("/signup", express.json(), (req, res) => {
  const { name, twitter, icon, description, walletAddress } = req.body;

  if (!name || !twitter || !icon || !description || !walletAddress) {
    return res.status(400).send("All fields are required");
  }

  const newCreator: Creator = {
    name,
    twitter,
    icon,
    description,
    walletAddress,
  };

  try {
    addCreator(newCreator);
    res.redirect(`/profiles/${name}`);
  } catch (error) {
    res.status(400).send("Error adding creator");
  }
});

app.get("/search", (req, res) => {
  const query = req.query.q?.toString().toLowerCase();
  if (!query) {
    return res.send("<li>Please enter a search query</li>");
  }

  const results = Array.from(creators.values()).filter(
    (creator) =>
      creator.name.toLowerCase().includes(query) ||
      creator.walletAddress.toLowerCase().includes(query),
  );

  if (results.length === 0) {
    return res.send("<li>No results found</li>");
  }

  const html = results
    .map(
      (creator) =>
        `<li><a href="/profiles/${creator.name}">${creator.name}</a></li>`,
    )
    .join("");

  res.send(html);
});
