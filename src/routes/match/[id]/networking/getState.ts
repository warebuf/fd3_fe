

export function getFullState(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
        console.log("SENT FULL STATE");
        ws.send(JSON.stringify({ type: "fullState" }));
    }
}