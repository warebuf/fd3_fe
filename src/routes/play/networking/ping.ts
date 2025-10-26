

let pingID = 0;
let intervalID = -1;

export function sendPing( ws: WebSocket ) {

    stopPing(); // ensure only 1 interval loop running

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
}