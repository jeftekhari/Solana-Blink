"use strict";

(function () {
  const display = document.getElementById("display");
  const memoDisplay = document.getElementById("memo");
  const gif = document.getElementById("gif");
  const audio = document.getElementById("pingAudio");
  const obsNotification = document.getElementById("obsNotification");
  let displayData = [];

  // Function to send a request to the WebSocket server
  function sendRequest(ws, walletAddress) {
    const request = {
      jsonrpc: "2.0",
      id: 420,
      method: "accountSubscribe",
      params: [
        walletAddress,
        {
          encoding: "jsonParsed",
          commitment: "finalized",
        },
      ],
    };
    ws.send(JSON.stringify(request));
  }

  async function playAudio() {
    audio.play();
  }

  async function pauseAudio() {
    audio.pause();
  }

  async function timer(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function showDisplayData() {
    for (const data of displayData) {
      if (data.isDisplayed === false) {
        console.log("donation!");

        display.textContent = `${data.amount} SOL Donated`;
        memoDisplay.textContent = data.memo;
        playAudio();
        obsNotification.className = "show";
        data.isDisplayed = true;

        // !!! IMPORTANT the animation can not be longer or equal to the total
        // display timer amound or the next donatation will not display !!!
        await timer(5000); //sleep 5 seconds
        obsNotification.classList.remove("show");
        // Pause before displaying the next donation
        await timer(1000);
      }
    }
    setTimeout(showDisplayData, 500); // min time between displaying memo
  }

  function checkSignature(tx) {
    for (const data of displayData) {
      if (data.signature === tx.signature) {
        return false;
      }
    }
    return true;
  }

  var url = window.location.search;
  var getQuery = url.split("?")[1];
  //   console.log(getQuery);
  var params = getQuery ? getQuery.split("&") : [];
  //   console.log(params);
  const MEMO_CA = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  const apiKey = "bc25d0b5-2b75-4ac3-81b9-a2f37ff51660";
  const walletAddress = params[0].split("=")[1];
  if (!apiKey) throw new Error("NO API KEY FOUND");

  const api = `https://api.helius.xyz/v0/addresses/${walletAddress}`;
  const rpc = `wss://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  const ws = new WebSocket(rpc);
  const enc = new TextDecoder("utf-8");
  let startup = true;

  ws.onopen = () => {
    console.log("Websocket open");
    sendRequest(ws, walletAddress);
  };

  ws.onmessage = (evt) => {
    const messageStr = evt.data.toString("utf8");

    try {
      const messageObj = JSON.parse(messageStr);
      //   console.log(messageStr);
      //   document.getElementById("text").innerHTML =
      //     `<h4>result received: loading transactions..</h4>`;
      console.log("Received:", messageObj);

      let memoData = "";
      const limit = 15;
      fetch(`${api}/transactions?api-key=${apiKey}&limit=${limit}`)
        .then((response) => {
          if (response.status === 429) throw new Error("Rate limited bro");
          return response.json();
        })
        .then((data) => {
          console.log("raw TXs", data);
          const filteredParsedData = [];
          const filteredRawTXData = data.filter((tx, i) => {
            if (tx.type === "TRANSFER") {
              const memoIX = tx.instructions.filter((ix) => {
                if (ix.programId === MEMO_CA) return true; // return only memo instructions
              });
              var bytes = bs58.default.decode(memoIX[0].data); // assuming only 1 memo instruction
              // console.log(enc.decode(bytes))
              memoData += `<div>${!startup && i === 0 ? "NEW" : ""} ${enc.decode(bytes).replace("twinkMemo:", `${tx.description.split(" ")[2]} SOL received:`)}<br></div>`;
              // document.getElementById("txData").innerHTML =
              `<h3>tx result received:</h3>${memoData}`;
              if (checkSignature(tx)) {
                filteredParsedData.push({
                  signature: tx.signature,
                  amount: tx.description.split(" ")[2],
                  memo: enc.decode(bytes).replace("twinkMemo:", ""),
                  timestamp: tx.timestamp,
                  isDisplayed: startup,
                });
                console.log(startup);
                return true;
              }
            }
          });
          console.log("filteredRawTXData", filteredRawTXData);
          return filteredParsedData;
        })
        .then((filteredParsedData) => {
          console.log("returned txs", filteredParsedData);
          displayData = filteredParsedData; // update displayData with our filtered/parsed data
          if (startup) showDisplayData();

          startup = false;
          console.error("final then display data: ", displayData);
        });
    } catch (e) {
      console.error("Failed to parse JSON:", e);
    }
  };

  ws.onerror = (evt) => {
    console.error("WebSocket error:", evt);
  };

  ws.onclose = () => {
    console.log("WebSocket is closed");
    // location.reload(true);
  };

  document.getElementById("test-btn").addEventListener("click", () => {
    console.log("TEST BTN");
    displayData.push({
      signature: `DUMMYTX${Math.random()}`,
      amount: "$100,000,000 !!!",
      memo: `POOOPOOO${new Date()}`,
      timestamp: new Date(),
      isDisplayed: startup,
    });
    displayData.map((data, i) => {
      if (i > displayData.length - 2) console.log(data); // log last tx
    });
  });
})();
