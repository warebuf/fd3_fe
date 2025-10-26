

import { sendPing, stopPing } from "./ping";


export function connectWS() {
    
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.addEventListener("open", () => {
      console.log("✅ Connected to server");
      sendPing(ws);
    });

    ws.addEventListener("message", (event) => {
      console.log("📩 Message from server:", event.data);
    });

    ws.addEventListener("close", () => {
      console.log("❌ Connection closed");
      // stopPing();
    });

    ws.addEventListener("error", (err) => {
      console.error("⚠️ WebSocket error", err);
      // stopPing();
    });

    return ws;
}