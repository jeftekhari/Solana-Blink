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

const app = express();
const port = process.env.PORT || 3000;
const origin = process.env.ORIGIN || `http://localhost:${port}`;
const conn = new Connection(
  process.env.SOLANA_RPC! || clusterApiUrl("mainnet-beta"),
);

// Website Stuff
app.use(routeLogger);
app.use("/static", express.static(path.join(__dirname, ".", "static")));
app.get("/", (_, res) => res.send(`<html><head>
<title>Blink Fren Tools</title>
<meta property="og:title" content="Tip Manboy" />
<meta property="og:description" content="Money Please" />
<meta property="og:url" content="https://blink.fren.tools/" />
<meta property="og:site_name" content="FrenTools">
<meta property="og:type" content="website">
<meta property="og:image" content="https://blink.fren.tools/static/img/ManBoy.png" />
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@JoeEftah">
<meta name="twitter:title" content="Manboy Blink">
<meta name="twitter:description" content="Tip Your Streamer">
<meta name="twitter:image" content="https://blink.fren.tools/static/img/ManBoy.png">
</head></html>`));
app.get("/obs/", (req, res) => {
  res.send(`${creatorPage(req.query.walletAddress as string)}`);
});
app.get("/robots.txt", (_, res) => {
  res.setHeader('content-type', 'text/plain;charset=UTF-8');
  res.send(`# Disallow everything.
  User-agent: *
  Disallow: /

  # Certain social media sites are whitelisted to allow crawlers to access page markup when links to /images are shared. 
  User-agent: Twitterbot
  Allow: /

  User-agent: facebookexternalhit
  Allow: /`)
  })


// API stuff
app.use(express.raw({ type: "text/*", limit: "1kb" })); // work around a bug where the json payload callback gets sent as text/plaintext
app.use(actionCorsMiddleware(createActionHeaders()));  // set the headers for all routes below, required for actions to work properly
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

app.options("/actions.json", (_, res) => res.send());
// app.get("/actions.json", (_, res) => res.redirect("/actions.json"))
app.get("/actions.json", (_, res) => {
  const payload: ActionsJson = {
    rules: [
      // map all root level routes to an action
      {
        pathPattern: "/",
        apiPath: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa"
      },
      // idempotent rule as the fallback
      {
        pathPattern: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa",
        apiPath: "/donate/CMeb68prsa7HmmVurnFLYQztAtgERsFNthvjddYJCJXa"
      }
    ]
  };
  res.send(payload);
});
// required for CORS
app.options("/donate/:wallet", (_, res) => res.send());
app.get("/donate/:wallet", (req, res) => {
  const { wallet } = req.params;
  const donateUrl = `/donate/${wallet}`;
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
app.options("/donate/:wallet/confirmed", (_, res) => res.send());
app.post("/donate/:wallet/confirmed", (req, res) => {
  const { wallet } = req.params;
  const { account, signature } = req.body;
  console.error(account, signature);
  const creator = getCreator(wallet);
  if (!creator) return res.status(400).send("Wallet not in database");

  const nextAction: NextAction = {
    type: "completed",
    icon: `${origin}/static/img/${creator.icon}`,
    title: "LFGGGGG for real!!",
    description: creator.description,
    label: "Donated!",
  };
  res.send(nextAction);
});

app.listen(port, () =>
  console.warn(
    `Successful start up at :${port} open up localhost:${port}/static into OBS`,
  ),
);
