
import type { GameState, Card } from "../engine/gameState"
import type { coordinate } from "./cardCoordinates";

export const CARD_W = 56;
export const CARD_H = 80;
const CARD_RADIUS = 6;
export const CARD_GAP = 8;
const ZONE_PAD = 8;
export const ZONE_H = CARD_H + ZONE_PAD * 2;
const CARD_BACK_COLOR = "#2C2C2A";
const CARD_FACE_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const LABEL_COLOR = "#888780";
const TEXT_COLOR = "#D3D1C7";
const DIVIDER_COLOR = "#D3D1C7";

const CROSSHAIR_COLOR = "#D3D1C7";
const CROSSHAIR_BORDER = "rgba(211,209,199,0.5)";
const CROSSHAIR_BG = "rgba(211,209,199,0.06)";

function roundRect( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const ARM = 12;
  const GAP = 2;
  const x0 = x - GAP;
  const y0 = y - GAP;
  const x1 = x + CARD_W + GAP;
  const y1 = y + CARD_H + GAP;

  ctx.save();
  ctx.strokeStyle = CROSSHAIR_COLOR;
  ctx.lineWidth = 0.5;
  ctx.lineCap = "square";
  ctx.beginPath();

  // top-left
  ctx.moveTo(x0, y0 + ARM);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x0 + ARM, y0);

  // top-right
  ctx.moveTo(x1 - ARM, y0);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x1, y0 + ARM);

  // bottom-left
  ctx.moveTo(x0, y1 - ARM);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x0 + ARM, y1);

  // bottom-right
  ctx.moveTo(x1 - ARM, y1);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1, y1 - ARM);

  ctx.stroke();
  ctx.restore();
}
function drawCard( 
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    cardId: number, 
    facedown: boolean, 
    selected: boolean,
    declared: boolean,
) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    if (facedown) {
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = CARD_BACK_COLOR;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#E24B4A";
        ctx.lineWidth = 0.5;
        roundRect(ctx, x + 4, y + 4, CARD_W - 8, CARD_H - 8, CARD_RADIUS - 2);
        ctx.stroke();
    } else {
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = selected ? CROSSHAIR_BG : CARD_FACE_COLOR;
        ctx.fill();
        ctx.restore();

        // Declared (pending summon) amber border
        if (declared) {
            ctx.strokeStyle = "#EF9F27";
            ctx.lineWidth = 1.5;
            roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
            ctx.stroke();
        } else {
            ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
            ctx.lineWidth = selected ? 1 : 0.5;
            roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
            ctx.stroke();
        }

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cardId), x + CARD_W / 2, y + CARD_H / 2);

        if (selected) drawCrosshair(ctx, x, y);
    }
}
function drawDeckStack( ctx: CanvasRenderingContext2D, x: number, y: number, count: number ) {
    // draw 3 stacked offset cards
    const offsets = [4, 2, 0];
    for (const o of offsets) {
        drawCard(ctx, x + o, y + o, -1, true, false, false);
    }
    // count badge
    ctx.fillStyle = "#AFA9EC";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), x + CARD_W / 2 + 4, y + CARD_H / 2 + 4);
}

function drawZoneLabel( ctx: CanvasRenderingContext2D, label: string, x: number, y: number ) {
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label.toUpperCase(), x, y);
}

function drawZone( ctx: CanvasRenderingContext2D, x: number, y: number, w: number ) {
    // zone background
    roundRect(ctx, x, y, w, ZONE_H, 6);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fill();
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function drawHand( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, handOrder: number[], cards: Card[], handCoords: coordinate[], faceDown: boolean, selectedIndex: number ) {
    // zone background
    roundRect(ctx, x, y, w, ZONE_H, 6);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fill();
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // draw cards
    for (let i = 0; i < handOrder.length; i++) {
        drawCard(ctx, handCoords[i].x, handCoords[i].y, cards[handOrder[i]].DefNo, faceDown, selectedIndex == handOrder[i], cards[handOrder[i]].Zone == 4);
    }
}
function drawPlayerTag( ctx: CanvasRenderingContext2D, label: string, x: number, y: number, isUser: boolean ) {
    const tagW = 80;
    const tagH = 20;
    roundRect(ctx, x, y, tagW, tagH, 4);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = "#D3D1C7";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + tagW / 2, y + tagH / 2);
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number, handOrder: number[][], handCoords: coordinate[][], selectedIndex: number) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const opponentIndex = userIndex === 0 ? 1 : 0;

    // draw dot grid
    if(false){ 
        const spacing = 8;
        const dotRadius = 0.5;
        const dotColor = "white";

        const cols = Math.ceil(W / spacing);
        const rows = Math.ceil(H / spacing);
        
        ctx.fillStyle = dotColor;
        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
            const x = col * spacing;
            const y = row * spacing;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            }
        }
    }

    const DECK_W = CARD_W + 8 + CARD_GAP; // deck stack + gap
    const ZONE_W = W - DECK_W - 32;       // remaining width for hand/field
    const LEFT_X = 16;
    const ZONE_X = LEFT_X + DECK_W;

    let y = 16;

    // --- Opponent ---
    drawPlayerTag(ctx, "Opponent", LEFT_X, y, false);
    y += 40;

    // Opponent deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 3 + 8);
    drawZoneLabel(ctx, "Hand", ZONE_X, y - 3);
    drawDeckStack(ctx, LEFT_X, y + 8, state.Deck[opponentIndex].length);
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[opponentIndex] ?? [], state.Cards, handCoords[opponentIndex] ?? [], true, selectedIndex); // face down
    y += ZONE_H + 16;

    // Opponent field
    drawZoneLabel(ctx, "Field", ZONE_X, y - 3);
    drawZone(ctx, ZONE_X, y, ZONE_W);
    y += ZONE_H + 16;

    y += 16;

    // Player field
    drawZoneLabel(ctx, "Your field", ZONE_X, y - 3);
    drawZone(ctx, ZONE_X, y, ZONE_W);
    y += ZONE_H + 16;

    // Player deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 3 + 8);
    drawZoneLabel(ctx, "Your hand", ZONE_X, y - 3);
    drawDeckStack(ctx, LEFT_X, y + 8, state.Deck[userIndex].length);
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[userIndex] ?? [], state.Cards, handCoords[userIndex] ?? [], false, selectedIndex); // face up
    y += ZONE_H + 16;

    drawPlayerTag(ctx, "You", LEFT_X, y, true);
}