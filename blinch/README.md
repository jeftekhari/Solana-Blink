# blinch
Solana blink actions client implemented in Node.JS using Express and Bun

This is setup to have a database (currently just in memory) of various different wallets and their blink configuration. To add your wallet open the `./src/constants.ts` file and add the following

```
creators.set("<wallet-address-here>", {
  name: "Your friendly name here",
  icon: "MyPfP.png", //copy your image into the `./static/img/` folder
  description: "Thank you for your donations!",
} as Creator);
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

This project was created using `bun init` in bun v1.0.26. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
