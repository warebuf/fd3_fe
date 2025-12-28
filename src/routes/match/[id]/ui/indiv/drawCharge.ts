

import type { GameState } from "../../engine/gameState"

const size = 36;


// could use bar, having a hard time with numbers + size
// could use radial clock
// could use radial clock on card border
// just show num / num

// im thinking you can add little dial lines (please dont forget what this looks like)
// im thinking that double digits need to be experimented with
// also we need to test the side by side
// also need to add RDY
// also need to add colors

  function drawPieClockBorder( ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, ratio: number, text: string ) {

    // Clamp ratio
    ratio = Math.max(0, Math.min(1, ratio));
  
    const startAngle = -Math.PI / 2; // 12 o'clock
    const endAngle = startAngle + 2 * Math.PI * ratio;
  
    // Draw empty full ring (background circle)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    //ctx.strokeStyle = "#333"; // background ring color
    ctx.strokeStyle = "red"; // background ring color
    ctx.lineWidth = 1;
    ctx.stroke();
  
    // Draw cooldown progress ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.strokeStyle = "#4caf50"; // green
    ctx.lineWidth = 1;
    ctx.lineCap = "round"; // smooth edges
    ctx.stroke();
  
    // Center text
    ctx.font = `${radius * 0.95}px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy);
  }

  function drawReady(ctx: CanvasRenderingContext2D, cx: number, cy: number){
    ctx.font = `6px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("READY", cx, cy);
  }
  
  export function drawCharge2( ctx: CanvasRenderingContext2D, x: number, y: number, state: GameState, unitIdx: number ) {
    const cx = x;
    const cy = y + size / 2 + 20;
    const radius = size * 0.18;
    const gap = radius * 2 + 4;
  
    const startIdx = state.FunctionStartIdx[unitIdx];
    const count = state.FunctionCount[unitIdx];
    for ( let i = startIdx; i < startIdx + count; i++ ) {

      if( state.FunctionType[i] === 0 ) {
        const charge = state.FunctionCharge[i];
        const SPD = state.FunctionSPD[i];

        if(charge === SPD) {
          drawReady(ctx, cx, cy);
          continue;
        }

        const idx = i - startIdx;
    
        let ratio = SPD > 0 ? charge / SPD : 0;
        ratio = Math.max(0, Math.min(1, ratio));
    
        const clockY = cy + idx * gap;
    
        // Convert cooldown left → readable seconds
        const msLeft = SPD > 0 ? (SPD - charge) : 0;
        const sec = Math.ceil(msLeft / 100) / 10;
        const text = sec > 0 ? sec.toString() : "";
    
        drawPieClockBorder(ctx, cx, clockY, radius, ratio, text);
      } else if ( state.FunctionType[i] === 1 ) {
        ctx.font = `6px sans-serif`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const idx = i - startIdx;

        const funcNum = state.Functions[i];

        if( funcNum === 6) { // at 75 EXP
          const exp = state.EXP[unitIdx];
          if( exp < 75) {
            ctx.fillText(exp.toLocaleString() + " / 75", cx, cy + (idx * gap) );
          } else {
            const mult = Math.floor(exp/75)
            ctx.fillText( "READY " + mult.toLocaleString() + "x", cx, cy + (idx * gap) );
          }
        }
        
      }

      
    }
  }
  