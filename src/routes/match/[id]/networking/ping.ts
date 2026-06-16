

import { writable } from "svelte/store";

// an updatable value that can be imported into other components
export const ping = writable<number>(0);
export const serverClockOffset = writable<number>(0);

// TODO: if you navigate away, you should cancel the ping intervals

// shoutout David Mills, who published the first NTP spec in 1985
// NTP is used for synchronizing clocks over a network
// using the minimum RTT time, we can have a best estimate of the difference between local and server clock
// when we want to reduce the lead time, we're going to have to study NTP, implement drift rate estimation, and the other networking ideas

let pingID = 0;
let intervalID = -1;

let rollingWindow: { rtt: number, offset: number }[] = [];


export function sendPing( ws: WebSocket ) {

    stopPing(); // ensure only 1 interval loop running
    rollingWindow = [];

    // send ping immediately
    for(let i = 0; i < 8; i++) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "p", id: pingID, t1: Date.now() }));
            pingID += 1;
        }
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
    const offset = serverReceive - (clientSend + rtt / 2);
    if (rollingWindow.length >= 32) { rollingWindow.shift(); }
    rollingWindow.push({ rtt, offset });

    let best = rollingWindow[0];
    for (let i = 1; i < rollingWindow.length; i++) {
        if (rollingWindow[i].rtt < best.rtt) best = rollingWindow[i];
    }

    serverClockOffset.set(best.offset);
    ping.set(rtt);
}