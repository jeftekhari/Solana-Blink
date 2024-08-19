"use strict";

(function () {
    // Function to send a request to the WebSocket server
    function sendRequest(ws, walletAddress) {
        const request = {
            "jsonrpc": "2.0",
            "id": 420,
            "method": "accountSubscribe",
             "params": [
              walletAddress,
              {
                "encoding": "jsonParsed",
                "commitment": "finalized"
              }
            ]
          }
        ws.send(JSON.stringify(request));
    }

    
    // Function to send a ping to the WebSocket server
    function startPing(ws) {
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('');
                console.log('Ping sent');
            }
        }, 30000); // Ping every 30 seconds
    }

    var url = window.location.search;
    var getQuery = url.split('?')[1];
    console.log(getQuery);
    var params = getQuery ? getQuery.split('&') : [];
    console.log(params);
    const apiKey = "";
    const walletAddress = params[0].split('=')[1];
    if (!apiKey) throw new Error("NO API KEY FOUND");
    const rpc = `wss://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const ws = new WebSocket(rpc);

    ws.onopen = () => {
        console.log("Websocket open");
        sendRequest(ws, walletAddress);
    };

    ws.onmessage = async (evt) => {
        const messageStr = evt.data.toString('utf8');
        try {
            const messageObj = JSON.parse(messageStr);
            console.log(messageStr);
            document.getElementById("text").innerHTML = `result received: ${messageStr}`;
            console.log('Received:', messageObj);

            //http request to wallet
            //get most recent N transactions
            //search transactions for memos
            //batch tx's together in memos
            const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}`, {
                method: 'GET',
                headers: {},
            });
            const data = await response.json();
            let memoData = "";
            data.map((tx) => {
                 return tx.instructions.map((ix) => {
                    if (ix.programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" ) {
                        memoData += `${ix.data}<br>`;
                        return ix.data;
                    } 
                })
            })
            document.getElementById("txData").innerHTML = `tx result received: ${memoData}`;


        } catch (e) {
            console.error('Failed to parse JSON:', e);
        }
    };
    
    ws.onerror = (evt) => {
        console.error('WebSocket error:', evt);
    };
    
    ws.onclose = () => {
        console.log('WebSocket is closed');
    };
})();