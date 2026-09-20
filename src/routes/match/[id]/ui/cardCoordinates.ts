
import { CARD_GAP, CARD_W, CARD_H, rowY, autoButtonRect, STRUCTURE_SLOTS } from "./drawBoard"

// the structure cards occupy the middle of each player's trap row; the traps form to their right
export function centerBlockW(): number {
    return STRUCTURE_SLOTS * CARD_W + (STRUCTURE_SLOTS - 1) * CARD_GAP;
}


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
    const step = CARD_W + CARD_GAP;
    const totalW = CARD_W + (count - 1) * step;
    const startX = (canvasWidth - totalW) / 2;
    const coords: coordinate[] = [];
    for (let j = 0; j < count; j++) {
        coords.push({ x: startX + j * step, y: cardY });
    }
    return coords;
}

function placeRow(positions: coordinate[], cards: number[], canvasWidth: number, cardY: number) {
    const slots = rowCoords(cards.length, canvasWidth, cardY);
    for (let i = 0; i < cards.length; i++) positions[cards[i]] = slots[i];
}

// left-aligned just right of the centered structure block, growing right
function placeRowRightward(positions: coordinate[], cards: number[], canvasWidth: number, cardY: number) {
    const startX = (canvasWidth + centerBlockW()) / 2 + CARD_GAP;
    for (let i = 0; i < cards.length; i++) {
        positions[cards[i]] = { x: startX + i * (CARD_W + CARD_GAP), y: cardY };
    }
}

// positions: sparse array indexed by card ID — positions[cardID] = screen coordinate
// chainCoords: parallel to state.Chain — only populated for non-card chain items (abilities, etc.)
export function calcBoardLayout(
    canvasWidth: number,
    playerNum: number,
    handOrder: number[][],
    field: number[][],
    chain: Array<{ cardID: number, isCard: boolean }>,
    traps: number[][]
): { positions: coordinate[], chainCoords: coordinate[], structureSlots: coordinate[][] } {
    const positions: coordinate[] = [];
    const chainCoords: coordinate[] = [];
    const structureSlots: coordinate[][] = [];

    // rows mirror around the chain at row 3: units, then traps/structures, then hand outward
    for (let t = 0; t < 2; t++) {
        const dir = t === playerNum ? 1 : -1;
        placeRow(positions, field[t] ?? [], canvasWidth, rowY(3 + dir * 1));
        placeRowRightward(positions, traps[t] ?? [], canvasWidth, rowY(3 + dir * 2));
        structureSlots[t] = rowCoords(STRUCTURE_SLOTS, canvasWidth, rowY(3 + dir * 2));
        placeRow(positions, handOrder[t] ?? [], canvasWidth, rowY(3 + dir * 3));
    }

    const chainSlots = rowCoords(chain.length, canvasWidth, rowY(3));
    for (let i = 0; i < chain.length; i++) {
        const { cardID, isCard } = chain[i];
        if (isCard) {
            positions[cardID] = chainSlots[i];
        } else {
            chainCoords[i] = chainSlots[i];
        }
    }

    return { positions, chainCoords, structureSlots };
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
    for (const cardID of cardIDs) {
        const pos = positions[cardID];
        if (!pos) continue;
        const r = autoButtonRect(pos.x, pos.y);
        if (mouseX >= r.x - SWITCH_HIT_PAD && mouseX <= r.x + r.w + SWITCH_HIT_PAD &&
            mouseY >= r.y - SWITCH_HIT_PAD && mouseY <= r.y + r.h + SWITCH_HIT_PAD) {
            return cardID;
        }
    }
    return -1;
}
