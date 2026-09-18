
import { get } from "svelte/store";
import type { GameState, Card, ChainItem } from "../engine/gameState"
import { Phase, PausePhase, CardType, Archetype, Zone, ChainEntry } from "../engine/gameState"
import type { coordinate } from "./cardCoordinates"
import { ping, serverClockOffset } from "../networking/ping";
import { debugDump } from "../debuggers/debug";
import { Icon, drawIcon } from "./icons";

export const CARD_W = 135;
export const CARD_H = 115;
const CARD_RADIUS = 6;
const STAT_BOX_W = 22;
const STAT_BOX_H = 14;
export const CARD_GAP = 8;
export const START_Y = 8;
export const ROW_GAP = 8;
// zones are horizontal rows, indexed top to bottom from the player's point of view
export function rowY(index: number): number {
    return START_Y + index * (CARD_H + ROW_GAP);
}

const BUTTON_W = 96;
const BUTTON_H = 18;
const BUTTON_GAP = 8;
export const STRUCTURE_SLOTS = 3;
export const STRUCTURE_HOTKEYS = ["d", "f", "g"];
// the button cluster stacks downward just below the player's hand row
function buttonRowY(index: number): number {
    return rowY(6) + CARD_H + 10 + index * (BUTTON_H + 4);
}
// team-wide stats sit on their own line under the two button rows
function teamStatsY(): number {
    return buttonRowY(2) + BUTTON_H / 2;
}

// one draw/auto column per structure, centered as a group; the pause/ready/skip buttons anchor off its edges
function structureStackW(): number {
    return STRUCTURE_SLOTS * BUTTON_W + (STRUCTURE_SLOTS - 1) * BUTTON_GAP;
}
function structureStackX(ctx: CanvasRenderingContext2D): number {
    return (ctx.canvas.clientWidth - structureStackW()) / 2;
}
function structureSlotX(ctx: CanvasRenderingContext2D, slot: number): number {
    return structureStackX(ctx) + slot * (BUTTON_W + BUTTON_GAP);
}

const CARD_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const TEXT_COLOR = "#D3D1C7";
const SUBTEXT_COLOR = "#888780";

const CROSSHAIR_COLOR = "#D3D1C7";
const CROSSHAIR_BORDER = "rgba(211,209,199,0.5)";
const CROSSHAIR_BG = "rgba(211,209,199,0.06)";
const P_PAD_W = 8;
const P_PAD_H = 6;
// charge/chain progress ring, inset into the card's bottom-right corner
const RING_R = 11;
const RING_LW = 3;

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

// returns one rect per structure slot, null where that structure can't currently draw
export function drawStructureDrawButtons(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): ({ x: number; y: number; w: number; h: number } | null)[] {
    const w = BUTTON_W;
    const h = BUTTON_H;
    const y = buttonRowY(0);

    return Array.from({ length: STRUCTURE_SLOTS }, (_, slot) => {
        const alive = (state.Structures[userIndex]?.[slot]?.HP ?? 0) > 0;
        const canDraw = alive && state.Phase === Phase.Play && (state.Mana[userIndex] ?? 0) >= 100;
        const x = structureSlotX(ctx, slot);

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
        const key = STRUCTURE_HOTKEYS[slot].toUpperCase();
        ctx.fillText(alive ? `Draw (100) [${key}]` : "Destroyed", x + 6, y + h / 2);
        ctx.textBaseline = "top";

        return canDraw ? { x, y, w, h } : null;
    });
}

// returns one rect per structure slot, null where that structure is destroyed
export function drawStructureAutoToggles(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): ({ x: number; y: number; w: number; h: number } | null)[] {
    const w = BUTTON_W;
    const h = BUTTON_H;
    const y = buttonRowY(1);

    return Array.from({ length: STRUCTURE_SLOTS }, (_, slot) => {
        const structure = state.Structures[userIndex]?.[slot];
        const alive = (structure?.HP ?? 0) > 0;
        const on = structure?.AutoAbility ?? false;
        const x = structureSlotX(ctx, slot);

        roundRect(ctx, x, y, w, h, 4);
        ctx.fillStyle = !alive ? "#222220" : on ? "#24361F" : "#2C2C2A";
        ctx.fill();
        ctx.strokeStyle = !alive ? "#3a3a38" : on ? "#3A8F5A" : CARD_BORDER;
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, w, h, 4);
        ctx.stroke();

        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = !alive ? "#555" : on ? "#6abf6a" : TEXT_COLOR;
        ctx.fillText(`Auto: ${on ? "ON" : "OFF"}`, x + 6, y + h / 2);
        ctx.textBaseline = "top";

        return alive ? { x, y, w, h } : null;
    });
}

export function drawPauseButton(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } | null {
    const paused = state.PausePhase === PausePhase.FullPause && state.TeamPaused === userIndex;
    const canPause = (state.PausePhase === PausePhase.Simulating || state.PausePhase === PausePhase.SimPause)
        && (state.TimeBank[userIndex] ?? 0) > 0;
    const active = state.Phase >= Phase.Draw && state.Phase !== Phase.GameEnd && (paused || canPause);

    const w = BUTTON_W;
    const h = BUTTON_H;

    // vertically centered beside the draw-button/auto-toggle stack, to its left
    const y = (buttonRowY(0) + buttonRowY(1)) / 2;
    const x = structureStackX(ctx) - w - BUTTON_GAP;

    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = paused ? "#24361F" : active ? "#2C2C2A" : "#222220";
    ctx.fill();
    ctx.strokeStyle = paused ? "#3A8F5A" : active ? CARD_BORDER : "#3a3a38";
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = paused ? "#6abf6a" : active ? TEXT_COLOR : "#555";
    ctx.fillText(paused ? "Unpause [P]" : "Pause [P]", x + 6, y + h / 2);
    ctx.textBaseline = "top";

    return active ? { x, y, w, h } : null;
}

export function drawReadyButton(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } | null {
    if (state.Phase !== Phase.Draw) return null;

    const ready = state.Ready[userIndex] ?? false;

    const w = BUTTON_W;
    const h = BUTTON_H;

    // vertically centered beside the draw-button/auto-toggle stack, to its right
    const y = (buttonRowY(0) + buttonRowY(1)) / 2;
    const x = structureStackX(ctx) + structureStackW() + BUTTON_GAP;

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
    ctx.fillText(`Ready: ${ready ? "YES" : "NO"} [R]`, x + 6, y + h / 2);
    ctx.textBaseline = "top";

    return { x, y, w, h };
}

export function drawSkipChainButton(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number): { x: number; y: number; w: number; h: number } | null {
    if (state.Phase !== Phase.Play || state.Chain.length === 0) return null;

    const skipping = state.SkipChain[userIndex] ?? false;
    const active = state.PausePhase !== PausePhase.FullPause;

    const w = BUTTON_W;
    const h = BUTTON_H;

    // same slot as the ready button, which is only shown during Draw
    const y = (buttonRowY(0) + buttonRowY(1)) / 2;
    const x = structureStackX(ctx) + structureStackW() + BUTTON_GAP;

    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = skipping ? "#24361F" : active ? "#2C2C2A" : "#222220";
    ctx.fill();
    ctx.strokeStyle = skipping ? "#3A8F5A" : active ? CARD_BORDER : "#3a3a38";
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = skipping ? "#6abf6a" : active ? TEXT_COLOR : "#555";
    ctx.fillText(`Skip: ${skipping ? "YES" : "NO"} [S]`, x + 6, y + h / 2);
    ctx.textBaseline = "top";

    // the opponent's skip is the cue that yours would resolve the chain right away
    const opponentSkipped = state.SkipChain.some((skip, team) => skip && team !== userIndex);
    if (opponentSkipped) {
        ctx.font = "9px sans-serif";
        ctx.fillStyle = "#6abf6a";
        ctx.fillText("Opponent skipped", x + 6, y + h + 3);
    }

    return active ? { x, y, w, h } : null;
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

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card, currentSimTime: number, faceDown?: boolean, selected?: boolean, showAbilityTimer: boolean = true ) {
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
    drawChainEntryIcon(ctx, cardType, card.ChainEntry, tx, ty);

    // the card's Active carries its own entry label, only real ability slots have Target set
    const active = card.Actives?.find(a => a.Target === -1 && a.ChainEntry !== ChainEntry.Dual);
    if (active) {
        ty += 11;
        drawChainEntryIcon(ctx, "Use", active.ChainEntry, tx, ty);
    }

    const contentBot = y + CARD_H - P_PAD_H; // description runs to the card's bottom padding

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
        drawTimerBar(ctx, x, y, abilityTimer.StartAtSimTime, abilityTimer.ExecuteAtSimTime, currentSimTime);
    }

    drawStatBox(ctx, x + CARD_W - 4 - STAT_BOX_W, y + 4, card.Cost, "#0E1E30", "#7AADDF");
    if (card.Type === CardType.Unit) {
        drawStatBox(ctx, x + CARD_W - 4 - STAT_BOX_W * 2 - 2, y + 4, card.HP, "#2E0E0E", "#D46B6B");
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

    ctx.restore();
}

// "<prefix> · <piece>", the entry drawn as its puzzle piece: red for Action,
// blue for Reaction, both for Dual.
function drawChainEntryIcon(ctx: CanvasRenderingContext2D, prefix: string, entry: number, x: number, y: number): void {
    const text = prefix + " · ";
    ctx.fillText(text, x, y);
    const entryX = x + ctx.measureText(text).width;

    // y is the text baseline, the piece sits above it. the rise is per icon,
    // the dual piece is 16px against the other two at 12px
    let icon = Icon.PuzzleBoth;
    let rise = 11;
    if (entry === ChainEntry.Action) {
        icon = Icon.PuzzleRed;
        rise = 9;
    } else if (entry === ChainEntry.Reaction) {
        icon = Icon.PuzzleBlue;
        rise = 9;
    }
    drawIcon(ctx, icon, entryX, y - rise);
}

function drawChargePips(ctx: CanvasRenderingContext2D, x: number, y: number, card: Card): void {
    const unlimited = card.MaxCharges > 20;
    const pipCount = unlimited ? card.Charges : card.MaxCharges;
    if (pipCount <= 0) return;
    const pipRX = 2;
    const pipRY = 3.5;
    const pipGap = 3;
    const totalW = pipCount * pipRX * 2 + (pipCount - 1) * pipGap;
    const pipStartX = x + (CARD_W - totalW) / 2 + pipRX;
    const pipY = y + CARD_H - P_PAD_H - pipRY;
    for (let p = 0; p < pipCount; p++) {
        const cx = pipStartX + p * (pipRX * 2 + pipGap);
        ctx.beginPath();
        ctx.moveTo(cx, pipY - pipRY);
        ctx.lineTo(cx + pipRX, pipY);
        ctx.lineTo(cx, pipY + pipRY);
        ctx.lineTo(cx - pipRX, pipY);
        ctx.closePath();
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
        drawFieldCard(ctx, pos.x, pos.y, card, 0, false, selectedIndex === cardID, true);
        drawChargePips(ctx, pos.x, pos.y, card);
        if (card.Actives[0]?.CanAutoFire) { // spawned tokens arrive with an empty Actives until the next fullState
            drawSwitch(ctx, pos.x, pos.y, card.Actives[0].AutoAbility, "Auto");
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
        if (!card.Ready && card.ReadyAtSimTime > 0) {
            drawTimerBar(ctx, pos.x, pos.y, card.SetStartAtSimTime, card.ReadyAtSimTime, currentSimTime);
        }
    }
}

function drawField(ctx: CanvasRenderingContext2D, cards: Card[], field: number[], positions: coordinate[], currentSimTime: number, selectedIndex: number): void {
    for (const cardID of field) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        drawFieldCard(ctx, pos.x, pos.y, card, currentSimTime, false, selectedIndex === cardID, true);
        drawChargePips(ctx, pos.x, pos.y, card);
        if (card.Actives[0]?.CanAutoFire) { // spawned tokens arrive with an empty Actives until the next fullState
            drawSwitch(ctx, pos.x, pos.y, card.Actives[0].AutoAbility, "Auto");
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
            pos = card.Zone === Zone.Pending ? positions[item.CardIndex] : chainCoords[i];
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
            drawTimerBar(ctx, pos.x, pos.y, item.StartAtActiveTime, item.ExecuteAtActiveTime, currentActiveTime);
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

export const SWITCH_H = 12;
export const SWITCH_HIT_W = 32;

// sits under the mana badge, right-aligned to the card edge
export function autoButtonRect(cardX: number, cardY: number) {
    return {
        x: cardX + CARD_W - 4 - SWITCH_HIT_W,
        y: cardY + 4 + STAT_BOX_H + 4,
        w: SWITCH_HIT_W,
        h: SWITCH_H,
    };
}

function drawSwitch(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, label: string): void {
    ctx.save();

    const { x: bx, y: by } = autoButtonRect(x, y);

    roundRect(ctx, bx, by, SWITCH_HIT_W, SWITCH_H, 3);
    ctx.fillStyle = on ? "#24361F" : "#1C1C1A";
    ctx.fill();
    ctx.strokeStyle = on ? "#3A8F5A" : CARD_BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, SWITCH_HIT_W, SWITCH_H, 3);
    ctx.stroke();

    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = on ? "#6abf6a" : TEXT_COLOR;
    ctx.fillText(label, bx + SWITCH_HIT_W / 2, by + SWITCH_H / 2);

    ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, handOrder: number[], cards: Card[], positions: coordinate[], faceDown: boolean, selectedIndex: number, currentSimTime: number): void {
    for (const cardID of handOrder) {
        const pos = positions[cardID];
        if (!pos) continue;
        const card = cards[cardID];
        drawFieldCard(ctx, pos.x, pos.y, card, currentSimTime, faceDown, selectedIndex === cardID, true);
    }
}

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

// runs flush inside the card's bottom edge, below the Auto switch band
function drawTimerBar( ctx: CanvasRenderingContext2D, x: number, y: number, startMs: number, endMs: number, currentSimTime: number ) {
    const progress = Math.min(Math.max((currentSimTime - startMs) / (endMs - startMs), 0), 1);
    const remainingMs = Math.max(endMs - currentSimTime, 0);
    const countdown = (remainingMs / 1000).toFixed(1);

    const cx = x + CARD_W - P_PAD_W - RING_R;
    const cy = y + CARD_H - P_PAD_H - RING_R;
    const r = RING_R - RING_LW / 2;

    // gray track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = RING_LW;
    ctx.stroke();

    // white fill, sweeping clockwise from the top
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = RING_LW;
    ctx.stroke();

    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = SUMMON_COLOR;
    ctx.fillText(countdown, cx, cy);

    ctx.textBaseline = "top";
    ctx.textAlign = "left";
}

function drawInfoPanel(ctx: CanvasRenderingContext2D, state: GameState, currentActiveTime: number) {
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
}

// occupies the centered card slot of a team's trap/continuous row
// one card per structure slot, filling the middle of the team's trap/continuous row
function drawStructureCards(ctx: CanvasRenderingContext2D, state: GameState, teamIndex: number, slots: coordinate[]) {
    for (let slot = 0; slot < slots.length; slot++) {
        const structure = state.Structures[teamIndex]?.[slot];
        const pos = slots[slot];
        if (!pos) continue;

        const x = Math.round(pos.x) + 0.5;
        const y = Math.round(pos.y) + 0.5;
        const alive = (structure?.HP ?? 0) > 0;

        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.fillStyle = alive ? CARD_COLOR : "#222220";
        ctx.fill();
        ctx.strokeStyle = alive ? CARD_BORDER : "#3a3a38";
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
        ctx.stroke();

        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let ty = y + P_PAD_H + 2;
        ctx.fillStyle = alive ? TEXT_COLOR : "#555";
        ctx.fillText(structure?.Name || "Structure", x + P_PAD_W, ty);
        ty += 14;

        // HP reads as the structure's own stat, matching the stat box on field cards
        drawStatBox(ctx, x + CARD_W - 4 - STAT_BOX_W, y + 4, structure?.HP ?? 0, "#2E0E0E", alive ? "#D46B6B" : "#555");

        if (structure?.Description) {
            ctx.fillStyle = SUBTEXT_COLOR;
            ctx.font = "italic 9px sans-serif";
            ctx.textBaseline = "alphabetic";
            drawWrappedText(ctx, structure.Description, x + P_PAD_W, ty + 10, CARD_W - P_PAD_W * 2, 11, y + CARD_H - P_PAD_H - 4);
            ctx.textBaseline = "top";
        }
    }
}

// team-wide stats, sat in the free space beside the button cluster under the hand
function drawTeamStats(ctx: CanvasRenderingContext2D, state: GameState, teamIndex: number) {
    const parts = [
        { text: `Mana ${state.Mana[teamIndex] ?? 0}`, color: "#7AADDF" },
        { text: `Reserves ${state.Deck[teamIndex].length}`, color: SUBTEXT_COLOR },
        { text: `Graveyard ${state.Grave[teamIndex].length}`, color: SUBTEXT_COLOR },
        { text: `Bank ${Math.floor((state.TimeBank[teamIndex] ?? 0) / 1000)}s`, color: SUBTEXT_COLOR },
    ];

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const GAP = 14;
    const totalW = parts.reduce((sum, p) => sum + ctx.measureText(p.text).width, 0) + GAP * (parts.length - 1);
    let tx = (ctx.canvas.clientWidth - totalW) / 2;
    const ty = teamStatsY();

    for (const part of parts) {
        ctx.fillStyle = part.color;
        ctx.fillText(part.text, tx, ty);
        tx += ctx.measureText(part.text).width + GAP;
    }
    ctx.textBaseline = "top";
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

const EQUIP_BADGE_R = 8;
const EQUIP_BADGE_COLOR = "#F5A623";

function drawEquipBadges(ctx: CanvasRenderingContext2D, cards: Card[], equip: number[][], positions: coordinate[]) {
    for (const team of equip) {
        for (const equipID of team) {
            const hostID = cards[equipID]?.EquipHostIndex ?? -1;
            const pos = positions[hostID];
            if (hostID < 0 || !pos) continue;

            const cx = pos.x + CARD_W - EQUIP_BADGE_R - 2;
            const cy = pos.y + EQUIP_BADGE_R + 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, EQUIP_BADGE_R, 0, Math.PI * 2);
            ctx.fillStyle = CARD_COLOR;
            ctx.fill();
            ctx.strokeStyle = EQUIP_BADGE_COLOR;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = EQUIP_BADGE_COLOR;
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("E", cx, cy + 0.5);
            ctx.restore();
        }
    }
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

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, currentWallTime: number, userIndex: number, positions: coordinate[], chainCoords: coordinate[], structureSlots: coordinate[][], handOrder: number[][], selectedIndex: number, preselecting: number) {
    const opponentIndex = userIndex === 0 ? 1 : 0;
    if (state.Phase === Phase.GameEnd) currentWallTime = state.WallTimestamp;

    const currentSimTime = computeCurrentSimTime(currentWallTime, state);
    const currentActiveTime = computeCurrentActiveTime(currentWallTime, state);

    // rows, top to bottom; the opponent's traps stay face down
    drawHand(ctx, handOrder[opponentIndex] ?? [], state.Cards, positions, true, selectedIndex, currentSimTime);
    drawContinuousZone(ctx, state.Cards, state.Continuous?.[opponentIndex] ?? [], positions, selectedIndex);
    drawTrapZone(ctx, state.Cards, state.Traps?.[opponentIndex] ?? [], positions, currentSimTime, selectedIndex, true);
    drawField(ctx, state.Cards, state.Field[opponentIndex], positions, currentSimTime, selectedIndex);

    drawChainZone(ctx, state.Chain, state.Cards, positions, chainCoords, currentActiveTime);

    drawField(ctx, state.Cards, state.Field[userIndex], positions, currentSimTime, selectedIndex);
    drawTrapZone(ctx, state.Cards, state.Traps?.[userIndex] ?? [], positions, currentSimTime, selectedIndex, false);
    drawContinuousZone(ctx, state.Cards, state.Continuous?.[userIndex] ?? [], positions, selectedIndex);
    drawHand(ctx, handOrder[userIndex] ?? [], state.Cards, positions, false, selectedIndex, currentSimTime);

    drawEquipBadges(ctx, state.Cards, state.Equip ?? [[], []], positions);

    drawStructureCards(ctx, state, opponentIndex, structureSlots[opponentIndex] ?? []);
    drawStructureCards(ctx, state, userIndex, structureSlots[userIndex] ?? []);

    drawTeamStats(ctx, state, userIndex);

    drawInfoPanel(ctx, state, currentActiveTime);

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
