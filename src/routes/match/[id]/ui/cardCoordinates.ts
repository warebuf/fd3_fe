
import { CARD_GAP, ZONE_H, CARD_W, CARD_H, ZONE_GAP, START_Y } from "./drawBoard"

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

function rowCoords(count: number, canvasWidth: number, cardY: number): coordinate[] {
    if (count === 0) return [];
    const totalW = count * CARD_W + (count - 1) * CARD_GAP;
    const startX = (canvasWidth - totalW) / 2;
    const coords: coordinate[] = [];
    for (let j = 0; j < count; j++) {
        coords.push({ x: startX + j * (CARD_W + CARD_GAP), y: cardY });
    }
    return coords;
}

const CONT_COL_START_Y = START_Y;
const CONT_COL_X_LEFT  = 6;

function columnCoords(count: number, startY: number, x: number): coordinate[] {
    const coords: coordinate[] = [];
    for (let i = 0; i < count; i++) {
        coords.push({ x, y: startY + i * (CARD_H + CARD_GAP) });
    }
    return coords;
}

// positions: sparse array indexed by card ID — positions[cardID] = screen coordinate
// stackCoords: parallel to state.ReactionStack — only populated for non-card stack items (abilities, etc.)
export function calcBoardLayout(
    canvasWidth: number,
    playerNum: number,
    handOrder: number[][],
    field: number[][],
    stack: Array<{ cardID: number, isCard: boolean }>,
    continuous: number[][]
): { positions: coordinate[], stackCoords: coordinate[] } {
    const positions: coordinate[] = [];
    const stackCoords: coordinate[] = [];

    let y = START_Y;
    const oppHandCardY     = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const oppFieldCardY    = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const stackCardY       = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
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
        const contSlots  = columnCoords(contCards.length, CONT_COL_START_Y, colX);
        for (let i = 0; i < contCards.length; i++) positions[contCards[i]] = contSlots[i];
    }

    const stackSlots = rowCoords(stack.length, canvasWidth, stackCardY);
    for (let i = 0; i < stack.length; i++) {
        const { cardID, isCard } = stack[i];
        if (isCard) {
            positions[cardID] = stackSlots[i];
        } else {
            stackCoords[i] = stackSlots[i];
        }
    }

    return { positions, stackCoords };
}

function hitTest(mouseX: number, mouseY: number, x: number, y: number): boolean {
    return mouseX >= x && mouseX <= x + CARD_W && mouseY >= y && mouseY <= y + CARD_H;
}

export function getClickedCard(
    mouseX: number,
    mouseY: number,
    positions: coordinate[],
    stack: Array<{ CardIndex: number }>,
    stackCoords: coordinate[]
): number {
    for (let cardID = 0; cardID < positions.length; cardID++) {
        const pos = positions[cardID];
        if (pos && hitTest(mouseX, mouseY, pos.x, pos.y)) return cardID;
    }
    for (let i = 0; i < stackCoords.length; i++) {
        const pos = stackCoords[i];
        if (pos && hitTest(mouseX, mouseY, pos.x, pos.y)) return stack[i].CardIndex;
    }
    return -1;
}

export function getClickedSwitch(
    mouseX: number,
    mouseY: number,
    positions: coordinate[],
    cardIDs: number[],
    yMin: number = 4,
    yMax: number = 26
): number {
    for (const cardID of cardIDs) {
        const pos = positions[cardID];
        if (!pos) continue;
        if (mouseX >= pos.x && mouseX <= pos.x + CARD_W &&
            mouseY >= pos.y + CARD_H + yMin && mouseY <= pos.y + CARD_H + yMax) {
            return cardID;
        }
    }
    return -1;
}
