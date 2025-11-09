


export function sendBenchMove( ws: WebSocket, unitID: number ) {
    if (ws && ws.readyState === WebSocket.OPEN) { 
        ws.send(JSON.stringify( { Type: "benchMove", UnitID: unitID } ));
        console.log("sent bench move", unitID);
    } else {
        console.log("could not send benchMove")
    }
}

