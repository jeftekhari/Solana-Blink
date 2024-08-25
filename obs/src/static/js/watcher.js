"use strict";

(function () {
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

  // Function to send a ping to the WebSocket server
  function startPing(ws) {
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("");
        console.log("Ping sent");
      }
    }, 30000); // Ping every 30 seconds
  }

  const display = document.getElementById("display");
  const memoDisplay = document.getElementById("memo");
  const gif = document.getElementById("gif");
  const audio = document.getElementById("pingAudio");
  const obsNotification = document.getElementById("obsNotification");
  var currentIndex = 0;
  var mostRecentTimeStamp = Math.floor(Date.now() / 1000); //UNIX time UTC in SECONDS\
  let displayData = [];

  async function playAudio() {
    audio.play();
  }

  async function pauseAudio() {
    audio.pause();
  }

  function sleep(i) {
    setTimeout(function () {
      console.log("sleep"); //  your code here
      if (--i) sleep(i); //  decrement i and call myLoop again if i > 0
    }, 1000);
  }
  function showDisplayData() {
    // console.log("showDisplayData Interval");
    gif.style.display = "none";
    display.textContent = "";
    memoDisplay.textContent = "";
    for (const data of displayData) {
      if (data.isDisplayed === false) {
        console.log("donation!");
        obsNotification.style.visibility = "visibile";
        display.textContent = `${data.amount} SOL Donated`;
        memoDisplay.textContent = data.memo;
        gif.style.display = "block";
        playAudio();
        data.isDisplayed = true;
        sleep(5);
        // return showDisplayData(); // was testing early return to sleep works
      }
    }
    setTimeout(showDisplayData, 3500); // currently this is the time of gif on screen
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
      fetch(
        `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=15`,
        // "http://localhost:3000/actions.json",
        {
          method: "GET",
          //   headers: {},
        },
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("tx data: ", data);
          console.log(`most recent timestamp ${mostRecentTimeStamp}`);
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
          displayData = filteredParsedData;
          if (startup) {
            showDisplayData();
          }
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
    location.reload(true);
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
