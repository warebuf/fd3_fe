
import { get } from "svelte/store";
import type { GameState, Card, ChainItem } from "../engine/gameState"
import { Phase, PausePhase, CardStatus, AbilityTimerType } from "../engine/gameState"
import type { coordinate, BoardLayout } from "./cardCoordinates"
import { ping } from "../networking/ping";

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

export const PCARD_W = 120;
export const PCARD_H = 100;
const P_PAD_W = 8;
const P_PAD_H = 6;

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
  const w = PCARD_W;
  const h = PCARD_H;
  const ARM = 12;
  const GAP = 2;
  const x0 = x - GAP;
  const y0 = y - GAP;
  const x1 = x + w + GAP;
  const y1 = y + h + GAP;

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



function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxY: number): number {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
        const testLine = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            if (currentY > maxY) break;
            ctx.fillText(line, x, currentY);
            line = words[i];
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line && currentY <= maxY) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
    }
    return currentY;
}

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card, currentSimTime: number, faceDown?: boolean, selected?: boolean ) {
    ctx.save();

    // adjust for blurry half pixel borders
    x = Math.round(x) + 0.5;
    y = Math.round(y) + 0.5;

    if (faceDown) {
        roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
        ctx.fillStyle = selected ? CROSSHAIR_BG : "#141414";
        ctx.fill();
        ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
        ctx.lineWidth = selected ? 1 : 0.5;
        roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
        ctx.stroke();
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "bold italic 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FD", x + PCARD_W / 2, y + PCARD_H / 2);
        if (selected) drawCrosshair(ctx, x, y);
        ctx.restore();
        return;
    }

    // draw card background
    roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
    ctx.fillStyle = selected ? CROSSHAIR_BG : CARD_COLOR;
    ctx.fill();

    // draw the border
    ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
    ctx.lineWidth = selected ? 1 : 0.5;
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
        cardType = "Unit";
    } else if(card.Type === 3) {
        cardType = "Spell";
    }
    ctx.fillText(cardType, tx, ty);

    const contentBot = y + PCARD_H - P_PAD_H - 12 - P_PAD_H; // top of footer divider

    // draw description
    const divY = ty + 8;
    if (card.Description) {
        ctx.fillStyle = SUBTEXT_COLOR;
        ctx.font = "italic 9px sans-serif";
        ctx.textBaseline = "alphabetic";
        drawWrappedText(ctx, card.Description, tx, divY + 10, PCARD_W - P_PAD_W * 2, 11, contentBot - 4);
    }

    // draw summoning bar above card
    if (card.Status === CardStatus.Summoning) {
        const summonTimer = card.AbilityTimers?.find(t => t.Type === AbilityTimerType.Summon);
        if (summonTimer) {
            drawTimerBar(ctx, x, y, summonTimer.StartAtSimTime, summonTimer.ExecuteAtSimTime, currentSimTime, "Summoning");
        }
    }

    // draw ability timer above card
    const abilityTimer = card.AbilityTimers?.find(t => t.Type === AbilityTimerType.Normal);
    if (abilityTimer) {
        drawTimerBar(ctx, x, y, abilityTimer.StartAtSimTime, abilityTimer.ExecuteAtSimTime, currentSimTime, "Ability");
    }

    // determine status
    let statusText: string;
    let statusColor: string;
    if (card.Status === CardStatus.Summoning) {
        statusText = "Summoning";
        statusColor = "#BFA43A";
    } else if (card.Status === CardStatus.UnitActive) {
        statusText = "Active";
        statusColor = "#3A8F5A";
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

    // draw hp (bottom-left) and cost (top-right)
    drawStatBox(ctx, x + PCARD_W - 4 - STAT_BOX_W, y + 4, card.Cost, "#0E1E30", "#7AADDF");
    drawStatBox(ctx, x + PCARD_W - 4 - STAT_BOX_W, y + PCARD_H - 4 - STAT_BOX_H, card.HP, "#2E0E0E", "#D46B6B");

    if (selected) drawCrosshair(ctx, x, y);

    if (!faceDown && card.AutoSummon > 0) {
        const badgeR = 7;
        const badgeX = x;
        const badgeY = y;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = "#F5C518";
        ctx.fill();
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(card.AutoSummon), badgeX, badgeY);
    }

    ctx.restore();
}

function drawField( ctx: CanvasRenderingContext2D, cards: Card[], field: number[], coords: coordinate[], currentSimTime: number, selectedIndex: number): void {
    for (let i = 0; i < field.length; i++) {
        drawFieldCard(ctx, coords[i].x, coords[i].y, cards[field[i]], currentSimTime, false, selectedIndex === field[i]);
    }
}

function drawChainZone( ctx: CanvasRenderingContext2D, chain: ChainItem[], cards: Card[], coords: coordinate[], currentActiveTime: number ): void {
    for (let i = 0; i < chain.length; i++) {
        const item = chain[i];
        const card = cards[item.CardID];
        if (!card) continue;
        drawFieldCard(ctx, coords[i].x, coords[i].y, card, 0); // no sim-time timers on chain cards
        drawTimerBar(ctx, coords[i].x, coords[i].y, item.StartAtActiveTime, item.ExecuteAtActiveTime, currentActiveTime, "Chain");
    }
}

function drawHand( ctx: CanvasRenderingContext2D, handOrder: number[], cards: Card[], handCoords: coordinate[], faceDown: boolean, selectedIndex: number, currentSimTime: number ) {
    for (let i = 0; i < handOrder.length; i++) {
        drawFieldCard( ctx, handCoords[i].x, handCoords[i].y, cards[handOrder[i]], currentSimTime, faceDown, selectedIndex === handOrder[i]);
    }
}

const STAT_BOX_W = 22;
const STAT_BOX_H = 14;
const STAT_BOX_R = 3;

function drawStatBox(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, bgColor: string, textColor: string) {
    roundRect(ctx, x, y, STAT_BOX_W, STAT_BOX_H, STAT_BOX_R);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value), x + STAT_BOX_W / 2, y + STAT_BOX_H / 2);
}

const SUMMON_COLOR = "#D3D1C7";

function computeCurrentActiveTime(currentWallTime: number, state: GameState): number {
    if (state.PausePhase === PausePhase.FullPause) {
        return state.PauseStack[PausePhase.FullPause] - state.FullPauseOffset;
    }
    return currentWallTime - state.FullPauseOffset;
}

function computeCurrentSimTime(currentWallTime: number, state: GameState): number {
    if (state.PausePhase === PausePhase.Simulating) {
        return currentWallTime - state.SimPauseOffset;
    }
    if (state.PausePhase === PausePhase.SimPause) {
        return state.PauseStack[PausePhase.SimPause] - state.SimPauseOffset;
    }
    // FullPause
    if (state.PauseStack[PausePhase.SimPause] > 0) {
        return state.PauseStack[PausePhase.SimPause] - state.SimPauseOffset;
    }
    return state.PauseStack[PausePhase.FullPause] - state.SimPauseOffset;
}

function drawTimerBar( ctx: CanvasRenderingContext2D, x: number, y: number, startMs: number, endMs: number, currentSimTime: number, label: string ) {
    const GAP = 12;
    const BAR_H = 4;
    const BAR_W = PCARD_W - 20;
    const barX = x + 10;
    const progress = Math.min(Math.max((currentSimTime - startMs) / (endMs - startMs), 0), 1);
    const remainingMs = Math.max(endMs - currentSimTime, 0);
    const countdown = (remainingMs / 1000).toFixed(1);

    const barY = y - GAP - BAR_H;

    ctx.font = "8px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = SUMMON_COLOR;
    ctx.textAlign = "left";
    ctx.fillText(label, barX, barY - 5);
    ctx.textAlign = "right";
    ctx.fillText(countdown, barX + BAR_W, barY - 5);

    // gray track
    ctx.fillStyle = "#444444";
    ctx.fillRect(Math.round(barX), Math.round(barY), BAR_W, BAR_H);
    // white fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(barX), Math.round(barY), Math.round(BAR_W * progress), BAR_H);
    // white border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(barX) + 0.5, Math.round(barY) + 0.5, BAR_W, BAR_H);
}

function drawBlockProgress( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, startMs: number, endMs: number, currentSimTime: number ) {
    const NUM_BLOCKS = 8;
    const BLOCK_H = 6;
    const GAP = 2;
    const LABEL_W = 44;
    const blocksW = w - GAP - LABEL_W;
    const blockW = (blocksW - GAP * (NUM_BLOCKS - 1)) / NUM_BLOCKS;
    const progress = Math.min(Math.max((currentSimTime - startMs) / (endMs - startMs), 0), 1);
    const filled = Math.floor(progress * NUM_BLOCKS);
    const remainingMs = Math.max(endMs - currentSimTime, 0);
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


function drawInfoPanel(ctx: CanvasRenderingContext2D, state: GameState, opponentIndex: number, userIndex: number) {
    const x = 6;
    let y = 6;
    const LINE_H = 14;

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Phase ${state.Phase}`, x, y);
    y += LINE_H;
    ctx.fillText(`Pause ${state.PausePhase}`, x, y);
    y += LINE_H;
    ctx.fillText(`${get(ping)} ms`, x, y);
    y += LINE_H * 2;

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText("Opponent:", x, y);
    y += LINE_H;
    ctx.fillStyle = "#D46B6B";
    ctx.fillText(`HP ${state.Structures[opponentIndex]?.HP ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = "#7AADDF";
    ctx.fillText(`Mana ${state.Mana[opponentIndex] ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Reserves ${state.Deck[opponentIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Graveyard ${state.Grave[opponentIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Time Bank ${Math.floor((state.TimeBank[opponentIndex] ?? 0) / 1000)}`, x, y);
    if (state.Phase === Phase.BoardSetup) {
        y += LINE_H;
        const oppReady = state.Ready[opponentIndex] ?? false;
        ctx.fillStyle = oppReady ? "#3A8F5A" : SUBTEXT_COLOR;
        ctx.fillText(oppReady ? "Ready" : "Not ready", x, y);
    }
    y += LINE_H * 2;

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText("You:", x, y);
    y += LINE_H;
    ctx.fillStyle = "#D46B6B";
    ctx.fillText(`HP ${state.Structures[userIndex]?.HP ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = "#7AADDF";
    ctx.fillText(`Mana ${state.Mana[userIndex] ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Reserves ${state.Deck[userIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Graveyard ${state.Grave[userIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Time Bank ${Math.floor((state.TimeBank[userIndex] ?? 0) / 1000)}`, x, y);
    if (state.Phase === Phase.BoardSetup) {
        y += LINE_H;
        const userReady = state.Ready[userIndex] ?? false;
        ctx.fillStyle = userReady ? "#3A8F5A" : SUBTEXT_COLOR;
        ctx.fillText(userReady ? "Ready" : "Not ready", x, y);
    }
}

const phaseLabels: Record<number, string> = {
    1: 'Draw Phase',
    2: 'Setup Phase',
    3: 'Reveal Phase',
    4: 'Play Phase',
    5: 'Game Over',
};
export const PHASE_MESSAGE_DURATION = 2500;

const FADE_IN  = 400;
const FADE_OUT = 800;

export function drawPhaseAnnouncement(ctx: CanvasRenderingContext2D, phase: number, phaseStartTime: number, now: number) {
    const label = phaseLabels[phase];
    if (!label) return;

    const elapsed = now - phaseStartTime;
    if (elapsed >= PHASE_MESSAGE_DURATION) return;

    let alpha: number;
    if (elapsed < FADE_IN) {
        alpha = elapsed / FADE_IN;
    } else if (elapsed > PHASE_MESSAGE_DURATION - FADE_OUT) {
        alpha = (PHASE_MESSAGE_DURATION - elapsed) / FADE_OUT;
    } else {
        alpha = 1;
    }

    const W = ctx.canvas.clientWidth;
    const H = ctx.canvas.clientHeight;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(label, W / 2, 30);
    ctx.restore();
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, currentWallTime: number, userIndex: number, layout: BoardLayout, handOrder: number[][], selectedIndex: number) {
    const opponentIndex = userIndex === 0 ? 1 : 0;
    if (state.Phase === Phase.GameEnd) currentWallTime = state.WallTimestamp;
    const currentSimTime = computeCurrentSimTime(currentWallTime, state);
    const currentActiveTime = computeCurrentActiveTime(currentWallTime, state);

    // Opponent hand
    drawHand(ctx, handOrder[opponentIndex] ?? [], state.Cards, layout.hand[opponentIndex] ?? [], true, selectedIndex, currentSimTime);

    if (state.Phase !== Phase.BoardSetup) {
        // Opponent field
        drawField(ctx, state.Cards, state.Field[opponentIndex], layout.field[opponentIndex] ?? [], currentSimTime, selectedIndex);

        // Chain zone
        drawChainZone(ctx, state.Chain, state.Cards, layout.chain, currentActiveTime);

        // Player field
        drawField(ctx, state.Cards, state.Field[userIndex], layout.field[userIndex] ?? [], currentSimTime, selectedIndex);
    }

    // Player hand
    drawHand(ctx, handOrder[userIndex] ?? [], state.Cards, layout.hand[userIndex] ?? [], false, selectedIndex, currentSimTime);

    drawInfoPanel(ctx, state, opponentIndex, userIndex);
}
