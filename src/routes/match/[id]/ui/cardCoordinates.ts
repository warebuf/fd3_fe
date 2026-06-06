
import { CARD_GAP, ZONE_H, CARD_W, CARD_H, ZONE_GAP, START_Y } from "./drawBoard"

export type coordinate = {
    x: number
    y: number
}

export type BoardLayout = {
    hand: coordinate[][]
    field: coordinate[][]
    stack: coordinate[]
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

export function calcBoardLayout( canvasWidth: number, playerNum: number, handOrder: number[][], field: number[][], stackLength: number ): BoardLayout {
    let y = START_Y;

    const oppHandCardY     = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const oppFieldCardY    = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const stackCardY       = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const playerFieldCardY = y + (ZONE_H - CARD_H) / 2;  y += ZONE_H + ZONE_GAP;
    const playerHandCardY  = y + (ZONE_H - CARD_H) / 2;

    const hand: coordinate[][] = [[], []];
    const fieldCoords: coordinate[][] = [[], []];

    for (let t = 0; t < 2; t++) {
        const isPlayer = t === playerNum;
        hand[t]        = rowCoords(handOrder[t]?.length ?? 0, canvasWidth, isPlayer ? playerHandCardY  : oppHandCardY);
        fieldCoords[t] = rowCoords(field[t]?.length    ?? 0, canvasWidth, isPlayer ? playerFieldCardY : oppFieldCardY);
    }

    const stack = rowCoords(stackLength, canvasWidth, stackCardY);

    return { hand, field: fieldCoords, stack };
}

function hitTest(mouseX: number, mouseY: number, x: number, y: number): boolean {
    return mouseX >= x && mouseX <= x + CARD_W && mouseY >= y && mouseY <= y + CARD_H;
}

export function getClickedCard(mouseX: number, mouseY: number, layout: BoardLayout, handOrder: number[][], field: number[][], stackIds: number[]): number {
    for (let i = 0; i < layout.hand.length; i++) {
        for (let j = 0; j < layout.hand[i].length; j++) {
            if (hitTest(mouseX, mouseY, layout.hand[i][j].x, layout.hand[i][j].y)) return handOrder[i][j];
        }
    }

    for (let i = 0; i < layout.field.length; i++) {
        for (let j = 0; j < layout.field[i].length; j++) {
            if (hitTest(mouseX, mouseY, layout.field[i][j].x, layout.field[i][j].y)) return field[i][j];
        }
    }
        
    for (let i = 0; i < layout.stack.length; i++) {
        if (hitTest(mouseX, mouseY, layout.stack[i].x, layout.stack[i].y)) return stackIds[i];
    }
        
    return -1;
}
