
import { get } from "svelte/store";
import type { GameState, Card, ChainItem } from "../engine/gameState"
import { Phase, PausePhase, CardType, Archetype, Zone, ChainEntry } from "../engine/gameState"
import type { coordinate } from "./cardCoordinates"
import { ping, serverClockOffset } from "../networking/ping";
import { debugDump } from "../debuggers/debug";

export const CARD_W = 150;
export const CARD_H = 125;
const CARD_RADIUS = 6;
export const CARD_GAP = 8;
export const ZONE_H = 96;
export const ZONE_GAP = 64;
export const START_Y = 32;
const CARD_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const TEXT_COLOR = "#D3D1C7";
const SUBTEXT_COLOR = "#888780";

const CROSSHAIR_COLOR = "#D3D1C7";
const CROSSHAIR_BORDER = "rgba(211,209,199,0.5)";
const CROSSHAIR_BG = "rgba(211,209,199,0.06)";
const P_PAD_W = 8;
const P_PAD_H = 6;

function drawCenteredOverlay(ctx: CanvasRenderingContext2D, lines: { text: string; color: string; font: string }[], bgColor: string) {
    const W = ctx.canvas.clientWidth;
    const H = ctx.canvas.clientHeight;
    const PAD_X = 10;
    const PAD_Y = 7;
    const LINE_H = 16;

    let maxW = 0;
    let textH = 0;
    for (const line of lines) {
        ctx.font = line.font;
        const m = ctx.measureText(line.text);
        if (m.width > maxW) maxW = m.width;
        if (!textH) textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    }

    const boxW = maxW + PAD_X * 2;
    const boxH = (lines.length - 1) * LINE_H + textH + PAD_Y * 2;
    const boxX = W / 2 - boxW / 2;
    const boxY = H / 2 - boxH / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(Math.round(boxX), Math.round(boxY), Math.round(boxW), Math.round(boxH));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const totalTextH = lines.length * LINE_H;
    let ty = H / 2 - totalTextH / 2 + LINE_H / 2;
    for (const line of lines) {
        ctx.font = line.font;
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, W / 2, ty);
        ty += LINE_H;
    }
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

export function drawStructureDrawButton(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } | null {
    const canDraw = state.Phase === Phase.Play && (state.Mana[userIndex] ?? 0) >= 100;

    const w = 96;
    const h = 18;
    const x = (ctx.canvas.clientWidth - w) / 2;
    const playerHandCardY = START_Y + (ZONE_H + ZONE_GAP) * 4 + (ZONE_H - CARD_H) / 2;
    const y = playerHandCardY - h - 6;

    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = canDraw ? "#2C2C2A" : "#222220";
    ctx.fill();
    ctx.strokeStyle = canDraw ? CARD_BORDER : "#3a3a38";
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = canDraw ? TEXT_COLOR : "#555";
    ctx.fillText("Draw (100) [D]", x + 6, y + h / 2);
    ctx.textBaseline = "top";

    return canDraw ? { x, y, w, h } : null;
}

export function drawStructureAutoToggle(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } {
    const on = state.Structures[userIndex]?.AutoAbility ?? false;

    const w = 96;
    const h = 18;
    const x = (ctx.canvas.clientWidth - w) / 2;
    const playerHandCardY = START_Y + (ZONE_H + ZONE_GAP) * 4 + (ZONE_H - CARD_H) / 2;
    const drawButtonY = playerHandCardY - 18 - 6;
    const y = drawButtonY - h - 4;

    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = on ? "#24361F" : "#2C2C2A";
    ctx.fill();
    ctx.strokeStyle = on ? "#3A8F5A" : CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = on ? "#6abf6a" : TEXT_COLOR;
    ctx.fillText(`Auto Draw: ${on ? "ON" : "OFF"}`, x + 6, y + h / 2);
    ctx.textBaseline = "top";

    return { x, y, w, h };
}

export function drawReadyButton(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } | null {
    if (state.Phase !== Phase.Draw) return null;

    const ready = state.Ready[userIndex] ?? false;

    const w = 96;
    const h = 18;
    const playerHandCardY = START_Y + (ZONE_H + ZONE_GAP) * 4 + (ZONE_H - CARD_H) / 2;
    const drawButtonY = playerHandCardY - 18 - 6;
    const autoToggleY = drawButtonY - h - 4;

    // vertically centered beside the draw-button/auto-toggle stack, to its right
    const stackTop = autoToggleY;
    const stackBottom = drawButtonY + h;
    const y = stackTop + (stackBottom - stackTop) / 2 - h / 2;

    const stackX = (ctx.canvas.clientWidth - w) / 2;
    const GAP = 8;
    const x = stackX + w + GAP;

    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = ready ? "#24361F" : "#2C2C2A";
    ctx.fill();
    ctx.strokeStyle = ready ? "#3A8F5A" : CARD_BORDER;
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ready ? "#6abf6a" : TEXT_COLOR;
    ctx.fillText(`Ready: ${ready ? "YES" : "NO"}`, x + 6, y + h / 2);
    ctx.textBaseline = "top";

    return { x, y, w, h };
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = CARD_W;
  const h = CARD_H;
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

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card, currentSimTime: number, faceDown?: boolean, selected?: boolean, showAbilityTimer: boolean = true, pendingInstant?: boolean ) {
    ctx.save();

    // adjust for blurry half pixel borders
    x = Math.round(x) + 0.5;
    y = Math.round(y) + 0.5;

    if (faceDown) {
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = selected ? CROSSHAIR_BG : "#141414";
        ctx.fill();
        ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
        ctx.lineWidth = selected ? 1 : 0.5;
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.stroke();
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "bold italic 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FD", x + CARD_W / 2, y + CARD_H / 2);
        if (selected) drawCrosshair(ctx, x, y);
        ctx.restore();
        return;
    }

    // draw card background
    roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fillStyle = selected ? CROSSHAIR_BG : CARD_COLOR;
    ctx.fill();

    // draw the border
    ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
    ctx.lineWidth = selected ? 1 : 0.5;
    roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
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
    if (card.Type === CardType.Unit) {
        cardType = "Unit";
    } else if (card.Type === CardType.Trap) {
        cardType = card.Zone === Zone.Trap && card.Ready ? "Trap · Ready" : "Trap";
    } else if (card.Type === CardType.Continuous) {
        cardType = "Continuous";
    }
    if (card.Archetype === Archetype.Tree) {
        cardType += " · Tree";
    }
    if (card.ChainEntry !== ChainEntry.Dual) {
        cardType += " · " + chainEntryLabel(card.ChainEntry);
    }
    ctx.fillText(cardType, tx, ty);

    // the card's Active carries its own entry label, only real ability slots have Target set
    const active = card.Actives?.find(a => a.Target === -1 && a.ChainEntry !== ChainEntry.Dual);
    if (active) {
        ty += 11;
        ctx.fillText("Use · " + chainEntryLabel(active.ChainEntry), tx, ty);
    }

    const contentBot = y + CARD_H - P_PAD_H - 12 - P_PAD_H; // top of the footer band the Auto switch sits in

    // draw description
    const divY = ty + 8;
    if (card.Description) {
        ctx.fillStyle = SUBTEXT_COLOR;
        ctx.font = "italic 9px sans-serif";
        ctx.textBaseline = "alphabetic";
        drawWrappedText(ctx, card.Description, tx, divY + 10, CARD_W - P_PAD_W * 2, 11, contentBot - 4);
    }

    // draw ability timer above card
    const abilityTimer = showAbilityTimer ? card.OnTick?.find(t => t.Active) : undefined;
    if (abilityTimer) {
        drawTimerBar(ctx, x, y, abilityTimer.StartAtSimTime, abilityTimer.ExecuteAtSimTime, currentSimTime, "Ability");
    }

    drawStatBox(ctx, x + CARD_W - 4 - STAT_BOX_W, y + 4, card.Cost, "#0E1E30", "#7AADDF");
    if (card.Type === CardType.Unit) {
        drawStatBox(ctx, x + CARD_W - 4 - STAT_BOX_W, y + CARD_H - 4 - STAT_BOX_H, card.HP, "#2E0E0E", "#D46B6B");
    }

    if (selected) drawCrosshair(ctx, x, y);

    const badgeNum = card.AutoSummon > 0 ? card.AutoSummon : 0;
    if (!faceDown && badgeNum > 0) {
        const badgeR = 7;
        const badgeX = x;
        const badgeY = y;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = "#6abf6a";
        ctx.fill();
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(badgeNum), badgeX, badgeY);
    }

    // hidden chain item submitted this window, awaiting reveal (client-local; not confirmed by the server)
    if (!faceDown && pendingInstant) {
        const boxW = 42;
        const boxH = 12;
        const boxX = x + CARD_W - boxW - 2;
        const boxY = y + 2;
        roundRect(ctx, boxX, boxY, boxW, boxH, 3);
        ctx.fillStyle = "#3a2a00";
        ctx.fill();
        ctx.strokeStyle = "#F5A623";
        ctx.lineWidth = 0.5;
        roundRect(ctx, boxX, boxY, boxW, boxH, 3);
        ctx.stroke();
        ctx.fillStyle = "#F5A623";
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Instant", boxX + boxW / 2, boxY + boxH / 2);
    }

    ctx.restore();
}

function chainEntryLabel(entry: number): string {
    if (entry === ChainEntry.Action) return "Action";
    if (entry === ChainEntry.Reaction) return "Reaction";
    return "Dual";
}

function drawChargePips(ctx: CanvasRenderingContext2D, x: number, y: number, card: Card): void {
    const unlimited = card.MaxCharges > 20;
    const pipCount = unlimited ? card.Charges : card.MaxCharges;
    if (pipCount <= 0) return;
    const pipR = 4;
    const pipGap = 4;
    const totalW = pipCount * pipR * 2 + (pipCount - 1) * pipGap;
    const pipStartX = x + (CARD_W - totalW) / 2 + pipR;
    const pipY = y + CARD_H / 2;
    for (let p = 0; p < pipCount; p++) {
        const cx = pipStartX + p * (pipR * 2 + pipGap);
        ctx.beginPath();
        ctx.arc(cx, pipY, pipR, 0, Math.PI * 2);
        if (unlimited || p < card.Charges) {
            ctx.fillStyle = "#7AADDF";
            ctx.fill();
        } else {
            ctx.strokeStyle = "#7AADDF";
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }
}

function drawContinuousZone(ctx: CanvasRenderingContext2D, cards: Card[], continuous: number[], positions: coordinate[], selectedIndex: number): void {
    for (const cardID of continuous) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        drawFieldCard(ctx, pos.x, pos.y, card, 0, false, selectedIndex === cardID);
        drawChargePips(ctx, pos.x, pos.y, card);
        if (card.Actives[0]?.CanAutoFire) { // spawned tokens arrive with an empty Actives until the next fullState
            drawSwitch(ctx, pos.x, pos.y, card.Actives[0].AutoAbility, "Auto", SWITCH_Y_OFFSET);
        }
    }
}

function drawTrapZone(ctx: CanvasRenderingContext2D, cards: Card[], traps: number[], positions: coordinate[], currentSimTime: number, selectedIndex: number, faceDown: boolean = false): void {
    for (const cardID of traps) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        // a set trap's only meaningful countdown is its setting bar, so the OnTick bar stays off
        drawFieldCard(ctx, pos.x, pos.y, card, currentSimTime, faceDown, selectedIndex === cardID, false);
        if (!card.Ready) {
            drawTimerBar(ctx, pos.x, pos.y, card.SetStartAtSimTime, card.ReadyAtSimTime, currentSimTime, "Setting");
        }
    }
}

function drawField(ctx: CanvasRenderingContext2D, cards: Card[], field: number[], positions: coordinate[], currentSimTime: number, selectedIndex: number): void {
    for (const cardID of field) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        drawFieldCard(ctx, pos.x, pos.y, card, currentSimTime, false, selectedIndex === cardID);
        drawChargePips(ctx, pos.x, pos.y, card);
        if (card.Actives[0]?.CanAutoFire) { // spawned tokens arrive with an empty Actives until the next fullState
            drawSwitch(ctx, pos.x, pos.y, card.Actives[0].AutoAbility, "Auto", SWITCH_Y_OFFSET);
        }
    }
}

function drawChainZone(ctx: CanvasRenderingContext2D, chain: ChainItem[], cards: Card[], positions: coordinate[], chainCoords: coordinate[], currentActiveTime: number): void {
    const topIndex = chain.length - 1;
    for (let i = 0; i < chain.length; i++) {
        const item = chain[i];
        const card = cards[item.CardIndex];

        let pos: coordinate | undefined;
        if (card) {
            pos = card.Zone === Zone.Chain ? positions[item.CardIndex] : chainCoords[i];
            if (!pos) continue;
            drawFieldCard(ctx, pos.x, pos.y, card, 0, false, false, false);
        } else {
            pos = chainCoords[i];
            if (!pos) continue;
            roundRect(ctx, pos.x, pos.y, CARD_W, CARD_H, CARD_RADIUS);
            ctx.fillStyle = CARD_COLOR;
            ctx.fill();
            ctx.strokeStyle = CARD_BORDER;
            ctx.lineWidth = 1;
            roundRect(ctx, pos.x, pos.y, CARD_W, CARD_H, CARD_RADIUS);
            ctx.stroke();
            ctx.fillStyle = SUBTEXT_COLOR;
            ctx.font = "italic 9px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Structure Ability", pos.x + CARD_W / 2, pos.y + CARD_H / 2);
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
        }

        if (i === topIndex) {
            drawTimerBar(ctx, pos.x, pos.y, item.StartAtActiveTime, item.ExecuteAtActiveTime, currentActiveTime, "Chain");
        } else {
            drawChainPositionBadge(ctx, pos.x, pos.y, i + 1);
        }
    }
}

function drawChainPositionBadge(ctx: CanvasRenderingContext2D, x: number, y: number, position: number): void {
    const GAP = 12;
    const BAR_H = 4;
    const BADGE_W = 50;
    const BADGE_H = 14;
    const BADGE_R = 4;
    const badgeX = x + (CARD_W - BADGE_W) / 2;
    const badgeY = y - GAP - BAR_H - BADGE_H;

    const BADGE_COLORS = [
        { bg: "#3a2000", text: "#FFD700" }, // yellow
        { bg: "#00213a", text: "#4FC3F7" }, // blue
        { bg: "#3a0000", text: "#FF5252" }, // red
        { bg: "#003a10", text: "#69F0AE" }, // green
    ];
    const color = BADGE_COLORS[(position - 1) % BADGE_COLORS.length];
    roundRect(ctx, badgeX, badgeY, BADGE_W, BADGE_H, BADGE_R);
    ctx.fillStyle = color.bg;
    ctx.fill();
    ctx.fillStyle = color.text;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Chain ${position}`, badgeX + BADGE_W / 2, badgeY + BADGE_H / 2);
}

const SWITCH_W = 28;
export const SWITCH_H = 12;
const SWITCH_R = 6;

// the Auto switch sits in the card's footer band, where the status text used to be.
// negative offset because drawSwitch measures from the card's bottom edge.
export const SWITCH_Y_OFFSET = -(P_PAD_H + SWITCH_H);
// the control is ~50px wide centred on the card; keep the hit box clear of the HP stat box
export const SWITCH_HIT_W = 76;

function drawSwitch(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, label: string, yOffset: number = 10): void {
    ctx.save();

    ctx.font = "8px sans-serif";
    const labelW = ctx.measureText(label).width;
    const LABEL_GAP = 5;
    const totalW = labelW + LABEL_GAP + SWITCH_W;
    const startX = x + (CARD_W - totalW) / 2;
    const sy = y + CARD_H + yOffset;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = on ? SUBTEXT_COLOR : "#444";
    ctx.fillText(label, startX, sy + SWITCH_H / 2);

    const tx = startX + labelW + LABEL_GAP;
    roundRect(ctx, tx, sy, SWITCH_W, SWITCH_H, SWITCH_R);
    ctx.fillStyle = on ? "#3A8F5A" : "#222220";
    ctx.fill();
    ctx.strokeStyle = on ? "#3A8F5A" : "#3a3a38";
    ctx.lineWidth = 0.5;
    roundRect(ctx, tx, sy, SWITCH_W, SWITCH_H, SWITCH_R);
    ctx.stroke();

    const knobR = SWITCH_H / 2 - 2;
    const knobX = on ? tx + SWITCH_W - SWITCH_R : tx + SWITCH_R;
    ctx.beginPath();
    ctx.arc(knobX, sy + SWITCH_H / 2, knobR, 0, Math.PI * 2);
    ctx.fillStyle = on ? "#D3D1C7" : "#555";
    ctx.fill();

    ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, handOrder: number[], cards: Card[], positions: coordinate[], faceDown: boolean, selectedIndex: number, currentSimTime: number, pendingInstantCardIndex: number = -1): void {
    for (const cardID of handOrder) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        drawFieldCard(ctx, pos.x, pos.y, card, currentSimTime, faceDown, selectedIndex === cardID, true, cardID === pendingInstantCardIndex);
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
        return state.FullPauseStartedAt - state.FullPauseOffset;
    }
    return currentWallTime - state.FullPauseOffset;
}

function computeCurrentSimTime(currentWallTime: number, state: GameState): number {
    if (state.PausePhase === PausePhase.Simulating) {
        return currentWallTime - state.SimPauseOffset;
    }
    if (state.PausePhase === PausePhase.SimPause) {
        return state.SimPauseStartedAt - state.SimPauseOffset;
    }
    // FullPause
    if (state.SimPauseStartedAt > 0) {
        return state.SimPauseStartedAt - state.SimPauseOffset;
    }
    return state.FullPauseStartedAt - state.SimPauseOffset;
}

function drawTimerBar( ctx: CanvasRenderingContext2D, x: number, y: number, startMs: number, endMs: number, currentSimTime: number, label: string ) {
    const GAP = 12;
    const BAR_H = 4;
    const BAR_W = CARD_W - 20;
    const barX = x + 10;
    const progress = Math.min(Math.max((currentSimTime - startMs) / (endMs - startMs), 0), 1);
    const remainingMs = Math.max(endMs - currentSimTime, 0);
    const countdown = (remainingMs / 1000).toFixed(1);
    //debugDump(`drawTimerBar: label=${label} start=${startMs%1e7} end=${endMs%1e7} currentSimTime=${currentSimTime%1e7} progress=${progress.toFixed(3)} remainingMs=${remainingMs.toFixed(1)}`);

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

function drawPriorityIndicator(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number) {
    const canvasW = ctx.canvas.clientWidth;

    const isYou = state.Priority === userIndex;
    const oppHandCardY    = START_Y + (ZONE_H - CARD_H) / 2;
    const playerHandCardY = START_Y + (ZONE_H + ZONE_GAP) * 4 + (ZONE_H - CARD_H) / 2;

    const x = canvasW / 2 + 2.5 * CARD_W;
    const w = 26;
    const h = 16;
    const GAP = 10; // clearance between the triangle's point and the hand cards it points at

    // sit toward the board's center relative to whichever hand row holds priority: above the
    // player's hand (bottom of screen, pointing down into it), below the opponent's hand
    // (top of screen, pointing up into it)
    let apexY: number, baseY: number;
    if (isYou) {
        apexY = playerHandCardY - GAP;
        baseY = apexY - h;
    } else {
        apexY = oppHandCardY + CARD_H + GAP;
        baseY = apexY + h;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, apexY);
    ctx.lineTo(x - w / 2, baseY);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath();
    ctx.fillStyle = "#2C2C2A";
    ctx.fill();
    ctx.strokeStyle = TEXT_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PRIO", x, baseY + (isYou ? 6 : -6));
    ctx.restore();
}

function drawInfoPanel(ctx: CanvasRenderingContext2D, state: GameState, currentActiveTime: number, opponentIndex: number, userIndex: number) {
    const x = 6;
    let y = 6;
    const LINE_H = 14;

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = SUBTEXT_COLOR;
    if (state.PhaseEndInActiveTime > 0) {
        const remainingMs = Math.max(state.PhaseEndInActiveTime - currentActiveTime, 0);
        ctx.fillText(`Phase ${state.Phase}, ${Math.ceil(remainingMs / 1000)}s remaining`, x, y);
    } else {
        ctx.fillText(`Phase ${state.Phase}`, x, y);
    }
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
}

const phaseLabels: Record<number, string> = {
    1: 'Draw Phase',
    2: 'Play Phase',
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

    ctx.save();
    ctx.globalAlpha = alpha;
    drawCenteredOverlay(ctx, [{ text: label, color: TEXT_COLOR, font: '11px sans-serif' }], '#000');
    ctx.restore();
}

function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number) {
    let textColor: string;
    if (state.Winner === -2) {
        textColor = TEXT_COLOR;
    } else if (state.Winner === userIndex) {
        textColor = "#2DB55D";
    } else {
        textColor = "#8B2020";
    }

    ctx.save();
    drawCenteredOverlay(ctx, [{ text: 'Game Over', color: textColor, font: '11px sans-serif' }], '#000');
    ctx.restore();
}

function drawPause(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number) {
    const label = state.TeamPaused === userIndex ? "You Paused" : "Opponent Paused";
    const timeBank = state.TimeBank[state.TeamPaused] ?? 0;

    const lines: { text: string; color: string; font: string }[] = [
        { text: label, color: TEXT_COLOR, font: '11px sans-serif' },
    ];
    if (timeBank > 0) {
        lines.push({ text: `${Math.floor(timeBank / 1000)}s`, color: TEXT_COLOR, font: '10px monospace' });
    }

    ctx.save();
    drawCenteredOverlay(ctx, lines, '#000');
    ctx.restore();
}

function drawPreselectHighlight(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.strokeStyle = "#F5A623";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    roundRect(ctx, x - 3, y - 3, CARD_W + 6, CARD_H + 6, CARD_RADIUS + 2);
    ctx.stroke();
    ctx.restore();
}

function drawPreselectArrow(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, ty: number) {
    const startX = sx + CARD_W / 2;
    const startY = sy + CARD_H / 2;
    const endX = tx + CARD_W / 2;
    const endY = ty + CARD_H / 2;
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLen = 8;
    const arrowAngle = Math.PI / 6;

    ctx.save();
    ctx.strokeStyle = "#F5A623";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowLen * Math.cos(angle - arrowAngle), endY - arrowLen * Math.sin(angle - arrowAngle));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowLen * Math.cos(angle + arrowAngle), endY - arrowLen * Math.sin(angle + arrowAngle));
    ctx.stroke();
    ctx.restore();
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, currentWallTime: number, userIndex: number, positions: coordinate[], chainCoords: coordinate[], handOrder: number[][], selectedIndex: number, preselecting: number, pendingInstantCardIndex: number = -1) {
    const opponentIndex = userIndex === 0 ? 1 : 0;
    if (state.Phase === Phase.GameEnd) currentWallTime = state.WallTimestamp;

    const currentSimTime = computeCurrentSimTime(currentWallTime, state);
    const currentActiveTime = computeCurrentActiveTime(currentWallTime, state);

    // Opponent hand
    drawHand(ctx, handOrder[opponentIndex] ?? [], state.Cards, positions, true, selectedIndex, currentSimTime);

    // Opponent field
    drawField(ctx, state.Cards, state.Field[opponentIndex], positions, currentSimTime, selectedIndex);

    // Chain zone
    drawChainZone(ctx, state.Chain, state.Cards, positions, chainCoords, currentActiveTime);

    // Player field
    drawField(ctx, state.Cards, state.Field[userIndex], positions, currentSimTime, selectedIndex);

    // Player hand
    drawHand(ctx, handOrder[userIndex] ?? [], state.Cards, positions, false, selectedIndex, currentSimTime, pendingInstantCardIndex);

    // Continuous zones (columns on left/right)
    drawContinuousZone(ctx, state.Cards, state.Continuous?.[userIndex] ?? [], positions, selectedIndex);
    drawContinuousZone(ctx, state.Cards, state.Continuous?.[opponentIndex] ?? [], positions, selectedIndex);

    // Trap zones (columns just inboard of the continuous ones); the opponent's stay face down
    drawTrapZone(ctx, state.Cards, state.Traps?.[userIndex] ?? [], positions, currentSimTime, selectedIndex);
    drawTrapZone(ctx, state.Cards, state.Traps?.[opponentIndex] ?? [], positions, currentSimTime, selectedIndex, true);

    drawInfoPanel(ctx, state, currentActiveTime, opponentIndex, userIndex);
    drawPriorityIndicator(ctx, state, userIndex);

    if (state.Phase === Phase.GameEnd) drawGameOver(ctx, state, userIndex);
    if (state.PausePhase === PausePhase.FullPause) drawPause(ctx, state, userIndex);

    // Preselect UI: highlight the card awaiting a target click
    if (preselecting >= 0) {
        const pos = positions[preselecting];
        if (pos) drawPreselectHighlight(ctx, pos.x, pos.y);
    }

    // Preselect UI: arrows from source to confirmed target
    for (let cardID = 0; cardID < state.Cards.length; cardID++) {
        const card = state.Cards[cardID];
        if (!card) continue;
        const srcPos = positions[cardID];
        if (!srcPos) continue;
        for (const ability of [...card.Actives, ...card.OnPlay]) {
            if (ability.Target < 0) continue;
            const dstPos = positions[ability.Target];
            if (!dstPos) continue;
            drawPreselectArrow(ctx, srcPos.x, srcPos.y, dstPos.x, dstPos.y);
        }
    }
}
