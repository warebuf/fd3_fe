

import { CARD_W, CARD_H, CARD_GAP, ZONE_H } from "./drawBoard"

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

const playerY = 408;
const oppY = 56;

export function calcCoordinates(order: number[][], canvasWidth: number, playerNum: number): coordinate[][] {

  const result: coordinate[][] = [];

  for (let i = 0; i < order.length; i++) {

    const row: coordinate[] = [];
    const isPlayer : boolean = (playerNum === i);
    
    // calculate center
    const totalW = order[i].length * CARD_W + (order[i].length - 1) * CARD_GAP;
    const startX = (canvasWidth - totalW) / 2;

    // calc coords
    for (let j = 0; j < order[i].length; j++) {
        const cx = startX + j * (CARD_W + CARD_GAP);
        const cy = (isPlayer ? playerY : oppY) + (ZONE_H - CARD_H) / 2;
        row.push({x:cx,y:cy});
    }

    result.push(row);
  }

  return result;
}

export function getClickedCard(mouseX: number, mouseY: number, coords: coordinate[][], order: number[][]) : number {
  for(let i = 0; i < coords.length; i++) {
    for(let j = 0; j < coords[i].length; j++) {
      const x = coords[i][j].x;
      const y = coords[i][j].y;
      if( (mouseX >= x && mouseX <= x + CARD_W) && (mouseY >= y && mouseY <= y + CARD_H) ) {
        return order[i][j];
      }
    }
  }
  return -1;
}