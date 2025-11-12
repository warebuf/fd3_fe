

// TODO: if you navigate away, you should cancel the ping intervals

let pingID = 0;
let intervalID = -1;

import { ping } from "./pingStore";

export function sendPing( ws: WebSocket ) {

    stopPing(); // ensure only 1 interval loop running

    // send ping immediately
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "p", id: pingID, t1: Date.now() }));
        pingID += 1;
    }

    // schedule a ping every 5 seconds
    intervalID = window.setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) { 
            stopPing();
            return; 
        }

        try { 
            ws.send(JSON.stringify( { type: "p", id: pingID, t1: Date.now() } )); 
            pingID += 1;
        } catch {
            return;
        }
    }, 5000);

}

export function stopPing( ) {
    if(intervalID >= 0) {
        clearInterval(intervalID);
        intervalID = -1;
    }
}

export function calculateOffset(clientSend: number, serverReceive: number, clientReceive: number) {
    const rtt = clientReceive - clientSend;
    const oneWay = rtt / 2;
    const offset = serverReceive - (clientSend + oneWay);
    console.log(`ping: ${rtt} ms, offset: ${offset} ms`);
    ping.set(rtt);
}