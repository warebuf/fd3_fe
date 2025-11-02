

import { sendPing, calculateOffset } from "./ping";


export function connectWS(matchID: string) {

    //console.log(`${window.location.origin.replace(/^http/, "ws")}/backend/ws?matchID=${encodeURIComponent(matchID)}`)
    const ws = new WebSocket( `${window.location.origin.replace(/^http/, "ws")}/backend/ws?matchID=${encodeURIComponent(matchID)}` );

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

    ws.addEventListener("close", (event) => {
      console.log("❌ Connection closed");

      if(event.reason === "second connection") {
        console.log("second connection")
        window.location.href = "/misc/second-connection";
      }

    });

    ws.addEventListener("error", (err) => {
      console.error("⚠️ WebSocket error", err);
      // stopPing();
    });

    return ws;
}