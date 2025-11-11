

export function getFullState( ws: WebSocket ) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "fullState" }));
    }
}