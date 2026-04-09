
import type { GameState } from "../../engine/gameState"

const CARD_W = 56;
const CARD_H = 80;
const CARD_RADIUS = 6;
const CARD_GAP = 10;
const ZONE_PAD = 10;
const ZONE_H = CARD_H + ZONE_PAD * 2;
const FIELD_COLOR = "#1a1a2e";
const CARD_BACK_COLOR = "#3C3489";
const CARD_FACE_COLOR = "#ffffff";
const CARD_BORDER = "#5DCAA5";
const LABEL_COLOR = "#888780";
const TEXT_COLOR = "#2C2C2A";
const BG_COLOR = "#f8f8f6";
const DIVIDER_COLOR = "#D3D1C7";

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
) {
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

function drawCard(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    cardId: number | null, // null = face down
) {
    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    if (cardId === null) {
        // face down
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = CARD_BACK_COLOR;
        ctx.fill();
        // subtle pattern
        ctx.restore();
        ctx.strokeStyle = "#AFA9EC";
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
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.stroke();

        // card ID label
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cardId), x + CARD_W / 2, y + CARD_H / 2);
    }
}

function drawDeckStack(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    count: number
) {
    // draw 3 stacked offset cards
    const offsets = [4, 2, 0];
    for (const o of offsets) {
        drawCard(ctx, x + o, y + o, null);
    }
    // count badge
    ctx.fillStyle = "#AFA9EC";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), x + CARD_W / 2 + 4, y + CARD_H / 2 + 4);
}

function drawZoneLabel(
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number, y: number
) {
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label.toUpperCase(), x, y);
}

function drawZone(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number,
    cardIds: number[],
    faceDown: boolean
) {
    // zone background
    roundRect(ctx, x, y, w, ZONE_H, 6);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fill();
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // cards
    for (let i = 0; i < cardIds.length; i++) {
        const cx = x + ZONE_PAD + i * (CARD_W + CARD_GAP);
        const cy = y + ZONE_PAD;
        drawCard(ctx, cx, cy, faceDown ? null : cardIds[i]);
    }
}

function drawDivider(
    ctx: CanvasRenderingContext2D,
    y: number, canvasW: number
) {
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvasW - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("battlefield", canvasW / 2, y);
}

function drawPlayerTag(
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number, y: number,
    isUser: boolean
) {
    const pad = 8;
    const tagW = 80;
    const tagH = 20;
    roundRect(ctx, x, y, tagW, tagH, 4);
    ctx.fillStyle = isUser ? "#E1F5EE" : "rgba(0,0,0,0.04)";
    ctx.fill();
    ctx.strokeStyle = isUser ? "#5DCAA5" : DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = isUser ? "#085041" : LABEL_COLOR;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + tagW / 2, y + tagH / 2);
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const opponentIndex = userIndex === 0 ? 1 : 0;

    // background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    const DECK_W = CARD_W + 8 + CARD_GAP; // deck stack + gap
    const ZONE_W = W - DECK_W - 32;       // remaining width for hand/field
    const LEFT_X = 16;
    const ZONE_X = LEFT_X + DECK_W;

    let y = 12;

    // --- Opponent ---
    drawPlayerTag(ctx, "Opponent", LEFT_X, y, false);
    y += 28;

    // Opponent deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 2);
    drawZoneLabel(ctx, "Hand", ZONE_X, y - 2);
    drawDeckStack(ctx, LEFT_X, y, state.Deck[opponentIndex].length);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Hand[opponentIndex], true); // face down
    y += ZONE_H + 12;

    // Opponent field
    drawZoneLabel(ctx, "Field", ZONE_X, y - 2);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Field[opponentIndex], false);
    y += ZONE_H + 16;

    // --- Divider ---
    drawDivider(ctx, y, W);
    y += 16;

    // --- Player ---
    // Player field
    drawZoneLabel(ctx, "Your field", ZONE_X, y - 2);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Field[userIndex], false);
    y += ZONE_H + 12;

    // Player deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 2);
    drawZoneLabel(ctx, "Your hand", ZONE_X, y - 2);
    drawDeckStack(ctx, LEFT_X, y, state.Deck[userIndex].length);
    drawZone(ctx, ZONE_X, y, ZONE_W, state.Hand[userIndex], false); // face up
    y += ZONE_H + 8;

    drawPlayerTag(ctx, "You", LEFT_X, y, true);
}