
import type { GameState, Card, Stack } from "../engine/gameState"
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

function drawDeckStack( ctx: CanvasRenderingContext2D, x: number, y: number, count: number ) {
    // draw 3 stacked offset cards
    const offsets = [4, 2, 0];
    for (const o of offsets) {
        drawHandCard(ctx, x + o, y + o, -1, true, false);
    }
    // count badge
    ctx.fillStyle = "#AFA9EC";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), x + CARD_W / 2 + 4, y + CARD_H / 2 + 4);
}

function drawZoneLabel( ctx: CanvasRenderingContext2D, label: string, x: number, y: number ) {
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label.toUpperCase(), x, y);
}

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card ) {
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
    if(card.Type == 1) {
        cardType = "Permanent";
    } else if(card.Type == 3) {
        cardType = "Spell";
    }
    ctx.fillText(cardType, tx, ty);
  
    // TODO: write description

    // determine status
    let statusColor = "";
    let statusText = "";
    if(card.Pending == true) {
        statusText = "Pending Summon";
        statusColor = "#BFA43A";
    } else {
        statusText = "Available";
        statusColor = "#3A8F5A";
    }

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

function drawField( ctx: CanvasRenderingContext2D, y: number, cards: Card[], field: number[], canvasWidth: number): void {
    const n = field.length;
    if (n === 0) return;

    // total width of all cards + gaps
    const totalW = n * PCARD_W + (n - 1) * CARD_GAP;

    // center within canvas
    const startX = (canvasWidth - totalW) / 2;

    for (let i = 0; i < n; i++) {
        const cardX = startX + i * (PCARD_W + CARD_GAP);
        drawFieldCard(ctx, cardX, y, cards[field[i]]);
    }
}

// returns how much to increment y by
function drawReactionZone( ctx: CanvasRenderingContext2D, x:number, y: number, stacks: Stack[], cards: Card[] ) : number {

    const margin = 10;
    const height = 300;

    // draw the reaction stacks
    const centerX = ctx.canvas.width / 2;
    const centerY = y + (height / 2);
    drawReactionStacks( ctx, centerX, centerY, stacks, cards );

    return height + (2*margin);
}

const ENTRY_TYPE_LABELS = ["Card", "Card Effect", "Ability", "Other", "Summon", "Spell"];

function drawReactionStacks( ctx: CanvasRenderingContext2D, centerX: number, centerY: number, stacks: Stack[], cards: Card[] ) {

    if (stacks.length <= 0) { return; }

    const itemWidth = PCARD_W;
    const itemHeight = PCARD_H;
    const itemMargin = 6;
    const stackPad_W = 10;
    const stackPad_H = 10;
    const titleHeight = 20;
    const stackMargin = 16;

    const stackContainerW = itemWidth + 2 * stackPad_W;
    const totalWidth = stacks.length * stackContainerW + (stacks.length - 1) * stackMargin;
    const groupStartX = centerX - totalWidth / 2;

    for (let i = 0; i < stacks.length; i++) {
        const stack = stacks[i];
        const numItems = stack.StackEntries.length;
        if (numItems <= 0) { continue; }

        // we do not want to draw certain items on the stack here
        if(stack.StackEntries.length == 1 && stack.StackEntries[0].Type === 3) { continue; } // do not draw stacks that are just 'other' type entries


        const totHeight = numItems * itemHeight + itemMargin * (numItems - 1);
        const stackX = groupStartX + i * (stackContainerW + stackMargin);
        const stackY = centerY - totHeight / 2;

        // container title background
        roundRectTop(ctx, stackX, stackY - stackPad_H - titleHeight, stackContainerW, titleHeight, CARD_RADIUS);
        ctx.fillStyle = "#383735";
        ctx.fill();

        // container title text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Stack ", stackX + 6, stackY - stackPad_H - titleHeight / 2 + 1);

        // container border
        roundRect(ctx, stackX + 0.5, stackY - stackPad_H - titleHeight + 0.5, stackContainerW, totHeight + 2 * stackPad_H + titleHeight, CARD_RADIUS);
        ctx.strokeStyle = CARD_BORDER;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // entries
        for (let j = 0; j < numItems; j++) {
            const entry = stack.StackEntries[j];
            const entryX = stackX + stackPad_W;
            const entryY = stackY + j * (itemHeight + itemMargin);

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
        }
    }

}

function drawHand( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, handOrder: number[], cards: Card[], handCoords: coordinate[], faceDown: boolean, selectedIndex: number ) {
    // zone background
    roundRect(ctx, x, y, w, ZONE_H, 6);
    // ctx.fillStyle = "rgba(0,0,0,0.03)";
    // ctx.fill();
    ctx.strokeStyle = TEXT_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // draw cards
    for (let i = 0; i < handOrder.length; i++) {
        drawHandCard( ctx, handCoords[i].x, handCoords[i].y, cards[handOrder[i]].DefNo, faceDown, selectedIndex == handOrder[i] );
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
    drawField(ctx, y, state.Cards, state.Field[opponentIndex], W);
    y += ZONE_H + 16;

    // Chain/Stack/Reaction Zone
    y += drawReactionZone(ctx, ZONE_X, y, state.ReactionPQ.Items, state.Cards);

    // Player field
    drawField(ctx, y, state.Cards, state.Field[userIndex], W);
    y += ZONE_H + 16;

    // Player deck + hand
    drawZoneLabel(ctx, "Deck", LEFT_X, y - 3 + 8);
    drawZoneLabel(ctx, "Your hand", ZONE_X, y - 3);
    drawDeckStack(ctx, LEFT_X, y + 8, state.Deck[userIndex].length);
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[userIndex] ?? [], state.Cards, handCoords[userIndex] ?? [], false, selectedIndex); // face up
    y += ZONE_H + 16;

    drawPlayerTag(ctx, "You", LEFT_X, y, true);
}
