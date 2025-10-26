

let pingID = 0;
let intervalID = -1;
let t1 = 0;

export function sendPing( ws: WebSocket ) {

    stopPing(); // ensure only 1 interval loop running

    intervalID = window.setInterval(() => {
        
        if (!ws || ws.readyState !== WebSocket.OPEN) { 
            stopPing();
            return; 
        }

        try { 
            t1 = Date.now();
            ws.send(JSON.stringify( { type: "p", id: pingID, t1: t1 } )); 
            pingID += 1;
        } catch {
            return;
        }
        
    }, 3000);

}

export function stopPing( ) {
    if(intervalID >= 0) {
        clearInterval(intervalID);
        intervalID = -1;
    }
}

