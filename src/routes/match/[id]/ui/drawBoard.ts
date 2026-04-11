
import type { GameState, Card } from "../engine/gameState"

const CARD_W = 56;
const CARD_H = 80;
const CARD_RADIUS = 6;
const CARD_GAP = 8;
const ZONE_PAD = 8;
const ZONE_H = CARD_H + ZONE_PAD * 2;
const CARD_BACK_COLOR = "#2C2C2A";
const CARD_FACE_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const LABEL_COLOR = "#888780";
const TEXT_COLOR = "#D3D1C7";
const DIVIDER_COLOR = "#D3D1C7";

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

// cardID: null = face down
function drawCard( ctx: CanvasRenderingContext2D, x: number, y: number, cardId: number, facedown: boolean ) {
    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    if (facedown) { // face down
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = CARD_BACK_COLOR;
        ctx.fill();
        // subtle pattern
        ctx.restore();
        ctx.strokeStyle = "#E24B4A";
        ctx.lineWidth = 0.5;
        roundRect(ctx, x + 4, y + 4, CARD_W - 8, CARD_H - 8, CARD_RADIUS - 2);
        ctx.stroke();
    } else {
        // face up
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = CARD_FACE_COLOR;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = CARD_BORDER;
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.stroke();

        // card ID label
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cardId), x + CARD_W / 2, y + CARD_H / 2);
    }
}

function drawDeckStack( ctx: CanvasRenderingContext2D, x: number, y: number, count: number ) {
    // draw 3 stacked offset cards
    const offsets = [4, 2, 0];
    for (const o of offsets) {
        drawCard(ctx, x + o, y + o, -1, true);
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

function drawZone( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, cardIndices: number[], cards: Card[], faceDown: boolean ) {
    // zone background
    roundRect(ctx, x, y, w, ZONE_H, 6);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fill();
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // calculate center
    const totalW = cardIndices.length * CARD_W + (cardIndices.length - 1) * CARD_GAP;
    const startX = (ctx.canvas.width - totalW) / 2;

    // draw cards
    for (let i = 0; i < cardIndices.length; i++) {
        const cx = startX + i * (CARD_W + CARD_GAP);
        const cy = y + (ZONE_H - CARD_H) / 2;
        drawCard(ctx, cx, cy, cards[cardIndices[i]].DefNo, faceDown);
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

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number) {
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
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Hand[opponentIndex], state.Cards, true); // face down
    y += ZONE_H + 16;

    // Opponent field
    drawZoneLabel(ctx, "Field", ZONE_X, y - 3);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Field[opponentIndex], state.Cards, false);
    y += ZONE_H + 16;

    y += 16;

    // Player field
    drawZoneLabel(ctx, "Your field", ZONE_X, y - 3);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Field[userIndex], state.Cards, false);
    y += ZONE_H + 16;

    // Player deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 3 + 8);
    drawZoneLabel(ctx, "Your hand", ZONE_X, y - 3);
    drawDeckStack(ctx, LEFT_X, y + 8, state.Deck[userIndex].length);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Hand[userIndex], state.Cards, false); // face up
    y += ZONE_H + 16;

    drawPlayerTag(ctx, "You", LEFT_X, y, true);
}