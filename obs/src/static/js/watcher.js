"use strict";

(function () {
    // Function to send a request to the WebSocket server
    function sendRequest(ws) {
        const request = {
            jsonrpc: "2.0",
            id: 420,
            method: "transactionSubscribe",
            params: [
                {
                    accountInclude: ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"]
                },
                {
                    commitment: "processed",
                    encoding: "jsonParsed",
                    transactionDetails: "full",
                    showRewards: true,
                    maxSupportedTransactionVersion: 0
                }
            ]
        };
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
    if (!apiKey) throw new Error("NO API KEY FOUND");
    const rpc = `wss://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const ws = new WebSocket(rpc);

    ws.onopen = () => {
        console.log("Websocket open");
        sendRequest(ws);
    };

    ws.onmessage = (evt) => {
        const messageStr = evt.data.toString('utf8');
        try {
            const messageObj = JSON.parse(messageStr);
            console.log(messageStr);
            document.getElementById("text").innerHTML = `result received: ${messageStr}`;
            console.log('Received:', messageObj);
            highlighter()
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