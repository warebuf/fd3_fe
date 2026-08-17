
import { CARD_GAP, ZONE_H, CARD_W, CARD_H, ZONE_GAP, START_Y, SWITCH_H, SWITCH_Y_OFFSET, SWITCH_HIT_W } from "./drawBoard"

export type coordinate = {
    x: number
    y: number
}

export function mirrorUIWithHand(order: number[][], hand: number[][]): number[][] {
    const result: number[][] = [];

    for (let i = 0; i < hand.length; i++) {
        const handRow = hand[i];
        const orderRow = order[i] ?? [];
        const row: number[] = [];

        const handSet = new Set(handRow);
        const orderSet = new Set(orderRow);

        for (let j = 0; j < orderRow.length; j++) {
            if (handSet.has(orderRow[j])) row.push(orderRow[j]);
        }
        for (let j = 0; j < handRow.length; j++) {
            if (!orderSet.has(handRow[j])) row.push(handRow[j]);
        }

        result.push(row);
    }

    return result;
}

const CONT_COL_X_LEFT  = 6;
const TRAP_COL_GAP     = CARD_W + CARD_GAP; // trap column sits just inboard of the continuous column
// the columns span the full canvas height, so rows have to stay clear of them on both edges
const SIDE_GUTTER      = CONT_COL_X_LEFT + TRAP_COL_GAP + CARD_W + CARD_GAP;

// rows center between the gutters, tightening their spacing rather than running under the columns
function rowCoords(count: number, canvasWidth: number, cardY: number): coordinate[] {
    if (count === 0) return [];
    const available = Math.max(canvasWidth - SIDE_GUTTER * 2, CARD_W);
    const step = count > 1 ? Math.min(CARD_W + CARD_GAP, (available - CARD_W) / (count - 1)) : 0;
    const totalW = CARD_W + (count - 1) * step;
    const startX = SIDE_GUTTER + (available - totalW) / 2;
    const coords: coordinate[] = [];
    for (let j = 0; j < count; j++) {
        coords.push({ x: startX + j * step, y: cardY });
    }
    return coords;
}

function columnCoords(count: number, canvasHeight: number, x: number): coordinate[] {
    if (count === 0) return [];
    const totalH = count * CARD_H + (count - 1) * CARD_GAP;
    const startY = (canvasHeight - totalH) / 2;
    const coords: coordinate[] = [];
    for (let i = 0; i < count; i++) {
        coords.push({ x, y: startY + i * (CARD_H + CARD_GAP) });
    }
    return coords;
}

// positions: sparse array indexed by card ID — positions[cardID] = screen coordinate
// chainCoords: parallel to state.Chain — only populated for non-card chain items (abilities, etc.)
export function calcBoardLayout(
    canvasWidth: number,
    canvasHeight: number,
    playerNum: number,
    handOrder: number[][],
    field: number[][],
    chain: Array<{ cardID: number, isCard: boolean }>,
    continuous: number[][],
    traps: number[][]
): { positions: coordinate[], chainCoords: coordinate[] } {
    const positions: coordinate[] = [];
    const chainCoords: coordinate[] = [];

    let y = START_Y;
    const oppHandCardY     = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const oppFieldCardY    = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const chainCardY       = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const playerFieldCardY = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const playerHandCardY  = y + (ZONE_H - CARD_H) / 2;

    for (let t = 0; t < 2; t++) {
        const isPlayer = t === playerNum;
        const handY  = isPlayer ? playerHandCardY  : oppHandCardY;
        const fieldY = isPlayer ? playerFieldCardY : oppFieldCardY;

        const handCards  = handOrder[t] ?? [];
        const handSlots  = rowCoords(handCards.length, canvasWidth, handY);
        for (let i = 0; i < handCards.length; i++) positions[handCards[i]] = handSlots[i];

        const fieldCards  = field[t] ?? [];
        const fieldSlots  = rowCoords(fieldCards.length, canvasWidth, fieldY);
        for (let i = 0; i < fieldCards.length; i++) positions[fieldCards[i]] = fieldSlots[i];

        const contCards  = continuous[t] ?? [];
        const colX       = isPlayer ? CONT_COL_X_LEFT : canvasWidth - CARD_W - 6;
        const contSlots  = columnCoords(contCards.length, canvasHeight, colX);
        for (let i = 0; i < contCards.length; i++) positions[contCards[i]] = contSlots[i];

        const trapCards  = traps[t] ?? [];
        const trapColX   = isPlayer ? colX + TRAP_COL_GAP : colX - TRAP_COL_GAP;
        const trapSlots  = columnCoords(trapCards.length, canvasHeight, trapColX);
        for (let i = 0; i < trapCards.length; i++) positions[trapCards[i]] = trapSlots[i];
    }

    const chainSlots = rowCoords(chain.length, canvasWidth, chainCardY);
    for (let i = 0; i < chain.length; i++) {
        const { cardID, isCard } = chain[i];
        if (isCard) {
            positions[cardID] = chainSlots[i];
        } else {
            chainCoords[i] = chainSlots[i];
        }
    }

    return { positions, chainCoords };
}

function hitTest(mouseX: number, mouseY: number, x: number, y: number): boolean {
    return mouseX >= x && mouseX <= x + CARD_W && mouseY >= y && mouseY <= y + CARD_H;
}

export function getClickedCard(
    mouseX: number,
    mouseY: number,
    positions: coordinate[],
    chain: Array<{ CardIndex: number }>,
    chainCoords: coordinate[]
): number {
    for (let cardID = 0; cardID < positions.length; cardID++) {
        const pos = positions[cardID];
        if (pos && hitTest(mouseX, mouseY, pos.x, pos.y)) return cardID;
    }
    for (let i = 0; i < chainCoords.length; i++) {
        const pos = chainCoords[i];
        if (pos && hitTest(mouseX, mouseY, pos.x, pos.y)) return chain[i].CardIndex;
    }
    return -1;
}

const SWITCH_HIT_PAD = 2;

// the switch now sits inside the card footer, so this box has to stay narrow enough
// to leave the rest of the card clickable for selection
export function getClickedSwitch(
    mouseX: number,
    mouseY: number,
    positions: coordinate[],
    cardIDs: number[]
): number {
    const xMin = (CARD_W - SWITCH_HIT_W) / 2;
    const yMin = CARD_H + SWITCH_Y_OFFSET - SWITCH_HIT_PAD;
    const yMax = CARD_H + SWITCH_Y_OFFSET + SWITCH_H + SWITCH_HIT_PAD;
    for (const cardID of cardIDs) {
        const pos = positions[cardID];
        if (!pos) continue;
        if (mouseX >= pos.x + xMin && mouseX <= pos.x + xMin + SWITCH_HIT_W &&
            mouseY >= pos.y + yMin && mouseY <= pos.y + yMax) {
            return cardID;
        }
    }
    return -1;
}
