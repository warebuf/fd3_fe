
import type { GameState, Card, Chain, ChainStep } from "../engine/gameState"
import { ChainStepType } from "../engine/gameState"
import type { CardIDToChainStepIndex } from "../engine/buildRecurringMap"
import type { coordinate } from "./cardCoordinates"

export const CARD_W = 56;
export const CARD_H = 80;
const CARD_RADIUS = 6;
export const CARD_GAP = 8;
const ZONE_PAD = 8;
export const ZONE_H = CARD_H + ZONE_PAD * 2;
const CARD_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const TEXT_COLOR = "#D3D1C7";
const SUBTEXT_COLOR = "#888780";
const DIVIDER_COLOR = "#6F6E68";

const CROSSHAIR_COLOR = "#D3D1C7";
const CROSSHAIR_BORDER = "rgba(211,209,199,0.5)";
const CROSSHAIR_BG = "rgba(211,209,199,0.06)";

const PCARD_W = 120;
const PCARD_H = 100;
const P_PAD_W = 8;
const P_PAD_H = 6;

function roundRectTop( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

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

function drawHandCard( ctx: CanvasRenderingContext2D, x: number, y: number, cardId: number, facedown: boolean, selected: boolean ) {

    // adjust for blurry half pixel borders
    x = Math.round(x) + 0.5; 
    y = Math.round(y) + 0.5;

    if (facedown) {
        ctx.save();
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = CARD_COLOR;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#E24B4A";
        ctx.lineWidth = 0.5;
        roundRect(ctx, x + 4, y + 4, CARD_W - 8, CARD_H - 8, CARD_RADIUS - 2);
        ctx.stroke();
    } else {
        ctx.save();
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = selected ? CROSSHAIR_BG : CARD_COLOR;
        ctx.fill();
        ctx.restore();

        // draw the border
        ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
        ctx.lineWidth = selected ? 1 : 0.5;
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.stroke();

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cardId), x + CARD_W / 2, y + CARD_H / 2);

        if (selected) drawCrosshair(ctx, x, y);
    }
}

const RESERVES_SIZE = 70;
const GRAVE_SIZE = 70;
const STRUCTURE_SIZE = 70;

function drawReserves( ctx: CanvasRenderingContext2D, x: number, y: number, count: number ) {
    const rx = Math.round(x) + 0.5;
    const ry = Math.round(y) + 0.5;
    const cx = rx + RESERVES_SIZE / 2;

    roundRect(ctx, rx, ry, RESERVES_SIZE, RESERVES_SIZE, CARD_RADIUS);
    ctx.fillStyle = CARD_COLOR;
    ctx.fill();
    ctx.strokeStyle = CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, rx, ry, RESERVES_SIZE, RESERVES_SIZE, CARD_RADIUS);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "600 18px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(count), cx, ry + 34);

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("RESERVES", cx, ry + 52);
}

function drawGraveyard( ctx: CanvasRenderingContext2D, x: number, y: number, count: number ) {
    const rx = Math.round(x) + 0.5;
    const ry = Math.round(y) + 0.5;
    const cx = rx + GRAVE_SIZE / 2;

    roundRect(ctx, rx, ry, GRAVE_SIZE, GRAVE_SIZE, CARD_RADIUS);
    ctx.fillStyle = CARD_COLOR;
    ctx.fill();
    ctx.strokeStyle = CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, rx, ry, GRAVE_SIZE, GRAVE_SIZE, CARD_RADIUS);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "600 18px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(count), cx, ry + 34);

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("GRAVEYARD", cx, ry + 52);
}

function drawMana( ctx: CanvasRenderingContext2D, x: number, y: number, mana: number ) {
    const rx = Math.round(x) + 0.5;
    const ry = Math.round(y) + 0.5;
    const cx = rx + STRUCTURE_SIZE / 2;

    roundRect(ctx, rx, ry, STRUCTURE_SIZE, STRUCTURE_SIZE, CARD_RADIUS);
    ctx.fillStyle = CARD_COLOR;
    ctx.fill();
    ctx.strokeStyle = "#4A7FBF";
    ctx.lineWidth = 0.5;
    roundRect(ctx, rx, ry, STRUCTURE_SIZE, STRUCTURE_SIZE, CARD_RADIUS);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#7AADDF";
    ctx.font = "600 18px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(mana), cx, ry + 34);

    ctx.fillStyle = "#7AADDF";
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("MANA", cx, ry + 52);
}

function drawStructure( ctx: CanvasRenderingContext2D, x: number, y: number, hp: number ) {
    const rx = Math.round(x) + 0.5;
    const ry = Math.round(y) + 0.5;
    const cx = rx + STRUCTURE_SIZE / 2;

    roundRect(ctx, rx, ry, STRUCTURE_SIZE, STRUCTURE_SIZE, CARD_RADIUS);
    ctx.fillStyle = CARD_COLOR;
    ctx.fill();
    ctx.strokeStyle = CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, rx, ry, STRUCTURE_SIZE, STRUCTURE_SIZE, CARD_RADIUS);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "600 18px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(hp), cx, ry + 34);

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("HP", cx, ry + 52);
}

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card, recurringStep?: ChainStep ) {
    ctx.save();

    // adjust for blurry half pixel borders
    x = Math.round(x) + 0.5; 
    y = Math.round(y) + 0.5;

    // draw card background
    roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
    ctx.fillStyle = CARD_COLOR;
    ctx.fill();

    // draw the border
    ctx.strokeStyle = CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
    ctx.stroke();

    // draw title
    let tx = x + P_PAD_W;
    let ty = y + P_PAD_H + 11; // 11 pixel font
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(card.Name, tx, ty);

    // draw card type
    ty += 12;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "9px sans-serif";
    let cardType = "";
    if(card.Type === 1) {
        cardType = "Permanent";
    } else if(card.Type === 3) {
        cardType = "Spell";
    }
    ctx.fillText(cardType, tx, ty);
  
    // draw recurring ability progress centered in the content area (between type text and footer divider)
    if (recurringStep) {
        const barX = x + P_PAD_W;
        const contentTop = y + P_PAD_H + 11 + 12; // bottom of type subtext
        const contentBot = y + PCARD_H - P_PAD_H - 12 - P_PAD_H; // top of footer divider
        const barY = Math.round((contentTop + contentBot) / 2) - 3; // 3 = BLOCK_H / 2
        drawBlockProgress(ctx, barX, barY, PCARD_W - P_PAD_W * 2, recurringStep.StartTime, recurringStep.OccurTime);
    }

    // determine status
    let statusColor = "";
    let statusText = "";
    statusText = "Available";
    statusColor = "#3A8F5A";
    //statusText = "Pending Summon";
    //statusColor = "#BFA43A";

    // draw status at footer
    const statusX = x + (PCARD_W/2);
    const statusY = y + PCARD_H - P_PAD_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom";
    ctx.fillText(statusText, statusX, statusY);

    // draw status indicator
    const textW = ctx.measureText(statusText).width;
    const indicatorX = statusX - (textW/2) - 8;
    const indicatorY = statusY - 6;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 2, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // draw footer divider
    const lineY = statusY - P_PAD_H - 12;
    const lineX1 = x + P_PAD_W;
    const lineX2 = x + PCARD_W - P_PAD_W;
    ctx.beginPath();
    ctx.moveTo(lineX1, lineY);
    ctx.lineTo(lineX2, lineY);
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
}

function drawField( ctx: CanvasRenderingContext2D, y: number, cards: Card[], field: number[], canvasWidth: number, recurringMap: Map<number, CardIDToChainStepIndex>, chains: Chain[]): void {
    const n = field.length;
    if (n === 0) return;

    // total width of all cards + gaps
    const totalW = n * PCARD_W + (n - 1) * CARD_GAP;

    // center within canvas
    const startX = (canvasWidth - totalW) / 2;

    for (let i = 0; i < n; i++) {
        const card = cards[field[i]];
        const cardX = startX + i * (PCARD_W + CARD_GAP);
        const loc = recurringMap.get(card.CardID);
        const recurringStep = loc
            ? chains.find(c => c.ChainID === loc.ChainID)?.ChainSteps[loc.Index]
            : undefined;
        drawFieldCard(ctx, cardX, y, card, recurringStep);
    }
}

// returns how much to increment y by
function drawReactionZone( ctx: CanvasRenderingContext2D, x:number, y: number, chains: Chain[], cards: Card[] ) : number {

    const margin = 10;
    const height = 300;

    // draw the reaction chain
    const centerX = ctx.canvas.clientWidth / 2;
    const centerY = y + (height / 2);
    drawReactionChains( ctx, centerX, centerY, chains, cards );

    return height + (2*margin);
}

const ENTRY_TYPE_LABELS = ["Card", "Card Effect", "Ability", "Other", "Permanent Summon", "Spell", "Recurring Ability"];

function drawReactionChains( ctx: CanvasRenderingContext2D, centerX: number, centerY: number, chains: Chain[], cards: Card[] ) {

    if (chains.length <= 0) { return; }

    const itemWidth = PCARD_W;
    const itemHeight = PCARD_H;
    const itemMargin = 6;
    const chainPad_W = 10;
    const chainPad_H = 10;
    const titleHeight = 20;
    const chainMargin = 16;

    const chainContainerW = itemWidth + 2 * chainPad_W;

    const drawableChains = chains
        .filter(c => c.ChainSteps.length > 0)
        .filter(c => !(c.ChainSteps.length === 1 && c.ChainSteps[0].Type === ChainStepType.Other))
        .map(c => ({ chain: c, visibleSteps: c.ChainSteps.filter(s => s.Type !== ChainStepType.Recurring) }))
        .filter(({ visibleSteps }) => visibleSteps.length > 0);

    if (drawableChains.length === 0) { return; }

    const totalWidth = drawableChains.length * chainContainerW + (drawableChains.length - 1) * chainMargin;
    const groupStartX = centerX - totalWidth / 2;

    for (let i = 0; i < drawableChains.length; i++) {
        const { chain, visibleSteps } = drawableChains[i];

        const totHeight = visibleSteps.length * itemHeight + itemMargin * (visibleSteps.length - 1);
        const chainX = groupStartX + i * (chainContainerW + chainMargin);
        const chainY = centerY - totHeight / 2;

        // container title background
        roundRectTop(ctx, chainX, chainY - chainPad_H - titleHeight, chainContainerW, titleHeight, CARD_RADIUS);
        ctx.fillStyle = "#383735";
        ctx.fill();

        // container title text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Chain ", chainX + 6, chainY - chainPad_H - titleHeight / 2 + 1);

        // container border
        roundRect(ctx, chainX + 0.5, chainY - chainPad_H - titleHeight + 0.5, chainContainerW, totHeight + 2 * chainPad_H + titleHeight, CARD_RADIUS);
        ctx.strokeStyle = CARD_BORDER;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // entries
        for (let j = 0; j < visibleSteps.length; j++) {
            const entry = visibleSteps[j];
            const entryX = chainX + chainPad_W;
            const entryY = chainY + j * (itemHeight + itemMargin);

            roundRect(ctx, entryX + 0.5, entryY + 0.5, itemWidth, itemHeight, CARD_RADIUS);
            ctx.fillStyle = CARD_COLOR;
            ctx.fill();
            ctx.strokeStyle = CARD_BORDER;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            const card = cards.find(c => c.CardID === entry.CardID);
            const cardName = card?.Name ?? `Card ${entry.CardID}`;
            const typeLabel = ENTRY_TYPE_LABELS[entry.Type] ?? "Unknown";

            let tx = entryX + 0.5 + P_PAD_W;
            let ty = entryY + 0.5 + P_PAD_H + 11;
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = "11px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(cardName, tx, ty);

            ty += 12;
            ctx.fillStyle = SUBTEXT_COLOR;
            ctx.font = "9px sans-serif";
            ctx.fillText(typeLabel, tx, ty);

            const barX = entryX + P_PAD_W;
            const entryContentTop = entryY + P_PAD_H + 11 + 12;
            const entryContentBot = entryY + itemHeight - P_PAD_H;
            const barY = Math.round((entryContentTop + entryContentBot) / 2) - 3;
            drawBlockProgress(ctx, barX, barY, itemWidth - P_PAD_W * 2, entry.StartTime, entry.OccurTime);
        }
    }

}

function drawHand( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, handOrder: number[], cards: Card[], handCoords: coordinate[], faceDown: boolean, selectedIndex: number ) {
    for (let i = 0; i < handOrder.length; i++) {
        drawHandCard( ctx, handCoords[i].x, handCoords[i].y, cards[handOrder[i]].DefNo, faceDown, selectedIndex === handOrder[i] );
    }
}

function drawBlockProgress( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, startMs: number, endMs: number ) {
    const NUM_BLOCKS = 8;
    const BLOCK_H = 6;
    const GAP = 2;
    const LABEL_W = 44;
    const blocksW = w - GAP - LABEL_W;
    const blockW = (blocksW - GAP * (NUM_BLOCKS - 1)) / NUM_BLOCKS;
    const progress = Math.min(Math.max((Date.now() - startMs) / (endMs - startMs), 0), 1);
    const filled = Math.floor(progress * NUM_BLOCKS);
    const remainingMs = Math.max(endMs - Date.now(), 0);
    const label = (remainingMs / 1000).toFixed(1);

    for (let i = 0; i < NUM_BLOCKS; i++) {
        const bx = x + i * (blockW + GAP);
        ctx.fillStyle = i < filled ? TEXT_COLOR : CARD_BORDER;
        ctx.fillRect(Math.round(bx), y, Math.floor(blockW), BLOCK_H);
    }

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "8px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w, y + BLOCK_H / 2);

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

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number, handOrder: number[][], handCoords: coordinate[][], selectedIndex: number, recurringMap: Map<number, CardIDToChainStepIndex>) {
    const W = ctx.canvas.clientWidth;
    const H = ctx.canvas.clientHeight;
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

    const LEFT_X = 16;
    const RIGHT_X = W - RESERVES_SIZE - LEFT_X;
    const ZONE_X = LEFT_X;
    const ZONE_W = RIGHT_X - CARD_GAP - LEFT_X;

    let y = 16;

    // --- Opponent ---
    drawPlayerTag(ctx, "Opponent", LEFT_X, y, false);
    y += 40;

    // Opponent hand + reserves (centered with hand) + graveyard below
    const oppReservesY = y + (ZONE_H - RESERVES_SIZE) / 2;
    drawReserves(ctx, RIGHT_X, oppReservesY, state.Deck[opponentIndex].length);
    drawGraveyard(ctx, RIGHT_X, oppReservesY + RESERVES_SIZE + 8, state.Grave[opponentIndex].length);
    if (state.Structures[opponentIndex] !== undefined)
        drawStructure(ctx, RIGHT_X, oppReservesY + RESERVES_SIZE + 8 + GRAVE_SIZE + 8, state.Structures[opponentIndex].HP);
    if (state.Mana[opponentIndex] !== undefined)
        drawMana(ctx, RIGHT_X, oppReservesY + RESERVES_SIZE + 8 + GRAVE_SIZE + 8 + STRUCTURE_SIZE + 8, state.Mana[opponentIndex]);
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[opponentIndex] ?? [], state.Cards, handCoords[opponentIndex] ?? [], true, selectedIndex); // face down
    y += ZONE_H + 16;

    // Opponent field
    drawField(ctx, y, state.Cards, state.Field[opponentIndex], W, recurringMap, state.ReactionPQ.Items);
    y += ZONE_H + 16;

    // Chain Zone
    y += drawReactionZone(ctx, ZONE_X, y, state.ReactionPQ.Items, state.Cards);

    // Player field
    drawField(ctx, y, state.Cards, state.Field[userIndex], W, recurringMap, state.ReactionPQ.Items);
    y += ZONE_H + 16;

    // Player hand + graveyard above + reserves (centered with hand)
    const playerReservesY = y + (ZONE_H - RESERVES_SIZE) / 2;
    if (state.Mana[userIndex] !== undefined) {
        drawMana(ctx, RIGHT_X, playerReservesY - GRAVE_SIZE - 8 - STRUCTURE_SIZE - 8 - STRUCTURE_SIZE - 8, state.Mana[userIndex]);
    }
    if (state.Structures[userIndex] !== undefined) {
        drawStructure(ctx, RIGHT_X, playerReservesY - GRAVE_SIZE - 8 - STRUCTURE_SIZE - 8, state.Structures[userIndex].HP);
    }
    drawGraveyard(ctx, RIGHT_X, playerReservesY - GRAVE_SIZE - 8, state.Grave[userIndex].length);
    drawReserves(ctx, RIGHT_X, playerReservesY, state.Deck[userIndex].length);
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[userIndex] ?? [], state.Cards, handCoords[userIndex] ?? [], false, selectedIndex); // face up
    y += ZONE_H + 16;

    drawPlayerTag(ctx, "You", LEFT_X, y, true);
}
