

import { writable } from "svelte/store";

// an updatable value that can be imported into other components
export const ping = writable<number>(0);
export const serverClockOffset = writable<number>(0);

// TODO: if you navigate away, you should cancel the ping intervals

let pingID = 0;
let intervalID = -1;

let rollingWindowOffset : number[] = [];


export function sendPing( ws: WebSocket ) {

    stopPing(); // ensure only 1 interval loop running

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
    const oneWay = rtt / 2;
    const offset = serverReceive - (clientSend + oneWay);
    if(rollingWindowOffset.length >= 32) {rollingWindowOffset.shift()};
    rollingWindowOffset.push(offset);
    let offsetSum = 0;
    for(let i = 0; i < rollingWindowOffset.length; i++) {
        offsetSum += rollingWindowOffset[i];
    }

    console.log(`ping: ${rtt} ms, offset: ${offset} ms, rwoffset: ${offsetSum/rollingWindowOffset.length} ms`);
    console.log("rollingWindowOffset", rollingWindowOffset)
    serverClockOffset.set(offsetSum/rollingWindowOffset.length)
    ping.set(rtt);
}