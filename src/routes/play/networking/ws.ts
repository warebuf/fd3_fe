

import { sendPing, stopPing, calculateOffset } from "./ping";


export function connectWS() {
    
    const ws = new WebSocket(
      window.location.origin.replace(/^http/, "ws") + "/ws"
    );
  
    ws.addEventListener("open", () => {
      console.log("✅ Connected to server");
      sendPing(ws);
    });

    ws.addEventListener("message", (event) => {
      
      const clientReceive = Date.now(); 
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "p":
          calculateOffset(msg.t1, msg.t2, clientReceive)
          break;
      }

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