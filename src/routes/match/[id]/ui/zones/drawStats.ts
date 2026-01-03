

import type { GameState } from "../../engine/gameState"

const w = 200;
const h = 150;
const radius = 10;
const margin = 20;

export function drawStats( 
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number, 
    currentState: GameState,
    hoverIdx: number,
    modelData: any
): void {

    if(hoverIdx < 0) {return}

    const modelNo = currentState.ModelNo[hoverIdx];
    const model = modelData[modelNo];

    // top left corner
    const centerX = canvasWidth - w - margin;
    const centerY = canvasHeight - h - margin;

    // draw background card
    ctx.beginPath();
    ctx.moveTo(centerX + radius, centerY); // top left corner, right end
    ctx.lineTo(centerX + w - radius, centerY); // top line
    ctx.quadraticCurveTo(centerX + w, centerY, centerX + w, centerY + radius); // top right corner
    ctx.lineTo(centerX + w, centerY + h - radius); // right line
    ctx.quadraticCurveTo(centerX + w, centerY + h, centerX + w - radius, centerY + h); // bottom right corner
    ctx.lineTo(centerX + radius, centerY + h); // bottom line
    ctx.quadraticCurveTo(centerX, centerY + h, centerX, centerY + h - radius); // bottom left corner
    ctx.lineTo(centerX, centerY + radius); // left line
    ctx.quadraticCurveTo(centerX, centerY, centerX + radius, centerY); // top left corner
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();

    // draw border
    ctx.strokeStyle = "#C5C6D0";
    ctx.lineWidth = 1;
    ctx.stroke();

    const x = centerX + 10;
    let y = centerY + 20;

    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "white";

    const str = "[ " + currentState.ModelNo[hoverIdx].toLocaleString() + " ]";
    ctx.fillText(str, x, y);
    const strWidth = ctx.measureText(str).width;

    const str2 = "  " +model.Name;
    const str2Width = ctx.measureText(str2).width;
    ctx.fillText(str2, x + strWidth, y);
    
    ctx.font = "italic 10px sans-serif";
    ctx.fillStyle = "#BDBDBD";
    let str3 = "  ";
    if(currentState.Zone[hoverIdx] === 0) { str3 += "On Bench"}
    else if(currentState.Zone[hoverIdx] === 1) { str3 += "On Field"}
    if(currentState.Zone[hoverIdx] === 2) { str3 += "Dead"}
    if(currentState.Zone[hoverIdx] === 3) { str3 += "To Summon"}
    ctx.fillText(str3 , x + strWidth + str2Width, y);

    ctx.textAlign = "right";
    ctx.fillText(hoverIdx.toLocaleString() , x + 180, y);
    ctx.textAlign = "left";
    y += 15;

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("HP: " + currentState.HP[hoverIdx].toLocaleString(), x, y)
    y += 15;

    ctx.fillText("EXP: " + currentState.EXP[hoverIdx].toLocaleString(), x, y)
    y += 30;

    for(let i = 0; i < model.Functions.length; i++) {
        ctx.fillText("Function: " + model.Functions[i].Name, x, y);
        y += 15;
        ctx.fillText(model.Functions[i].Description, x,y)
        y += 22.5;
    }
    

}