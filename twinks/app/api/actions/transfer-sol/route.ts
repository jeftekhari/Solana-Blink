import {
    ActionPostResponse,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
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
  import { DEFAULT_MSG_SIGN, DEFAULT_SOL_ADDRESS, DEFAULT_SOL_AMOUNT } from "./const";
  
  // create the standard headers for this route (including CORS)
  const headers = createActionHeaders();
  
  export const GET = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const { toPubkey } = validatedQueryParams(requestUrl);
  
      const baseHref = new URL(
        `/api/actions/transfer-sol?to=${toPubkey.toBase58()}`,
        requestUrl.origin,
      ).toString();
  
      const payload: ActionGetResponse = {
        title: "Tip Your Favorite Streamer!",
        icon: new URL("/ManBoy.png", requestUrl.origin).toString(),
        description: "Tipping Manboy",
        label: "Transfer", // this value will be ignored since `links.actions` exists
        links: {
          actions: [
            {
              label: "Send .01 SOL", // button text
              href: `${baseHref}&amount=${".01"}`,
            },
            {
              label: "Send .1 SOL", // button text
              href: `${baseHref}&amount=${".1"}`,
            },
            {
              label: "Send .2 SOL", // button text
              href: `${baseHref}&amount=${".2"}`,
            },
            {
              label: "Tip Manboy with SOL!", // button text
              href: `${baseHref}&amount={amount}&message={message}`, // this href will have a text input
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
                }
              ],
            },
          ],
        },
      };
  
      return Response.json(payload, {
        headers,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers,
      });
    }
  };
  
  // DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
  // THIS WILL ENSURE CORS WORKS FOR BLINKS
  export const OPTIONS = async (req: Request) => {
    return new Response(null, { headers });
  };
  
  export const POST = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const { amount, toPubkey, message } = validatedQueryParams(requestUrl);
      console.log("sending "+amount);
      console.log("message "+message);
  
      const body: ActionPostRequest = await req.json();
  
      // validate the client provided input
      let account: PublicKey;
      try {
        account = new PublicKey(body.account);  
      } catch (err) {
        return new Response('Invalid "account" provided', {
          status: 400,
          headers,
        });
      }
  
      const connection = new Connection(
        process.env.SOLANA_RPC! || clusterApiUrl("mainnet-beta"),
      );
  
      // ensure the receiving account will be rent exempt
      const minimumBalance = await connection.getMinimumBalanceForRentExemption(
        0, // note: simple accounts that just store native SOL have `0` bytes of data
      );

    // re-enable this when changing from lamports to pure sol

      // if (amount * LAMPORTS_PER_SOL < minimumBalance) {
      //   throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
      // }
  
      // create an instruction to transfer native SOL from one wallet to another
      const transferSolInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      });

      console.log(transferSolInstruction);
  
      // get the latest blockhash amd block height
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
  
      // create a legacy transaction
      const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
      }).add(transferSolInstruction);
  
      transaction.add(
        new TransactionInstruction({
          programId: new PublicKey(MEMO_PROGRAM_ID),
          data: Buffer.from(`${DEFAULT_MSG_SIGN + message}`, "utf8"),
          keys: []
        }),
      );

      console.log(transaction);

      // versioned transactions are also supported
      // const transaction = new VersionedTransaction(
      //   new TransactionMessage({
      //     payerKey: account,
      //     recentBlockhash: blockhash,
      //     instructions: [transferSolInstruction],
      //   }).compileToV0Message(),
      //   // note: you can also use `compileToLegacyMessage`
      // );
  
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `Send ${amount} SOL to ${toPubkey.toBase58()}`
        }
        // note: no additional signers are needed
        // signers: [],
      });

      console.error(payload);
  
      return Response.json(payload, {
        headers,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers,
      });
    }
  };
  
  function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
    let amount: number = DEFAULT_SOL_AMOUNT;
    let message: string | undefined = ""
  
    try {
      if (requestUrl.searchParams.get("to")) {
        toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
      }
    } catch (err) {
      throw "Invalid input query parameter: to";
    }
  
    try {
      if (requestUrl.searchParams.get("amount")) {
        amount = parseFloat(requestUrl.searchParams.get("amount")!);
      }
  
      if (amount <= 0) throw "amount is too small";
    } catch (err) {
      throw "Invalid input query parameter: amount";
    }

    try {
      if (requestUrl.searchParams.get("message")) {
        message = requestUrl.searchParams.get("message")?.toString();
      }
    } catch {
      throw "Invalid input query parameter: message";
    }
  
    return {
      amount,
      toPubkey,
      message
    };
  }