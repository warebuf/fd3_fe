

import type { GameState } from '../../engine/gameState'
import type { Coordinate } from '../misc/Coordinates';

let targetSprite : ImageBitmap;
let targetIconSprite : ImageBitmap;
let swordIconSprite : ImageBitmap;

let selectedUnit : number = -1; // index of selected unit
let cx : number = -1;
let cy : number = -1;

let buttons : number[] = []; // the nth function that requires a button
let buttonTypes : string[] = []; // either "Manual" or target code (ex: E:1)
let selectedButton : number = -1;
let pendingTargets: number[] = [];

const buttonSize = 16;
const gap = 3;

// there is definitely bad coding in this file. this is before i thought of a dict for unit idx -> ui pos

export async function initDrawMenuSprites() {
        
    let url = "/crosshairs/RedSquare.png"; 
    let res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load image: ${url}`);
    let blob = await res.blob();
    targetSprite = await createImageBitmap(blob);

    url = "/buttons/AimButton.png";
    res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load image: ${url}`);
    blob = await res.blob();
    targetIconSprite = await createImageBitmap(blob);

    url = "/buttons/SwordButton.png";
    res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load image: ${url}`);
    blob = await res.blob();
    swordIconSprite = await createImageBitmap(blob);

}

export function resetSelected() {
    selectedUnit = -1;
    cx = -1;
    cy = -1;
    buttons = [];
    buttonTypes = [];
    selectedButton = -1;
    pendingTargets = [];
}

export function setSelected(modelData: any, state : GameState, unitIdx: number, x: number, y: number, ) : boolean {
    let valid = false;
    
    const modelNo = state.ModelNo[unitIdx];

    // for this unit's model, if it has a manual function, then set it up, and return true
    for(let i = 0; i < modelData[modelNo].Functions.length; i++) {

        if( 
            modelData[modelNo].Functions[i].Target.startsWith("E") || 
            modelData[modelNo].Functions[i].Target.startsWith("A") 
        ) {
            buttons.push(i);
            buttonTypes.push(modelData[modelNo].Functions[i].Target);
            valid = true;
        }
        
        if( modelData[modelNo].Functions[i].Type === "Manual" ) {
            buttons.push(i);
            buttonTypes.push("Manual");
            valid = true;
        }

    }

    if(valid) {
        selectedUnit = unitIdx;
        cx = x;
        cy = y;
        return true;
    }

    return false;
}

// if filled, return true
export function setPendingTargets( targetIdx : number, onTeam : boolean ) : boolean {
    const split = buttonTypes[selectedButton].split(":");
    const targetType = split[0];
    const targetCount : number = parseInt(split[1], 10);
    if(
        (targetType === "A" && onTeam) ||
        (targetType === "E" && !onTeam) ||
        (targetType === "*")
    ) {
        pendingTargets.push(targetIdx);
        if(targetCount >= pendingTargets.length) { return true; }
    }

    return false
}

export function getPendingTargets() : number[] {
    return pendingTargets;
}

export function getSelectedUnitIdx() : number {
    return selectedUnit;
}
export function getSelectedFuncIdx(state : GameState) : number {
    if(selectedButton < 0 || selectedUnit < 0) { return -1; }
    const nthFunc = buttons[selectedButton];
    const fIdx = state.FunctionStartIdx[selectedUnit] + nthFunc;
    return fIdx;
}

export function getAutoFuncIdx(state : GameState) : number {
    if(selectedUnit < 0) { return -1; }

    // iterate through the funcs
    const startIdx = state.FunctionStartIdx[selectedUnit];
    const count = state.FunctionCount[selectedUnit];
    for(let i = 0; i < count; i++) {
        const fidx = startIdx + i;
        if( state.FunctionType[fidx] === 1) { // find the manual func
            return fidx;
        }
    }
    return -1;
}

export function getSelectedButtonType() : string {
    if(selectedButton < 0) {return ""; }
    return buttonTypes[selectedButton];
}

export function drawPendingTargets(ctx: CanvasRenderingContext2D, unitPos: Record<number, Coordinate>) {
    const w = 70;
    const h = 70;

    for(let i = 0; i < pendingTargets.length; i++) {
        const pos = unitPos[pendingTargets[i]];
        ctx.drawImage( targetSprite, pos.X - (w/2), pos.Y - (h/2), w, h );
    }
}

export function drawTargets(ctx: CanvasRenderingContext2D, state: GameState, unitPos: Record<number, Coordinate>, hoveredIdx : number, uiState : number){
    const w = 70;
    const h = 70;

    console.log()

    let uid = hoveredIdx;
    if(uid < 0) { uid = selectedUnit; }
    if(uid < 0) { return; }

    const startIdx = state.FunctionStartIdx[uid];
    const numFunctions = state.FunctionCount[uid];
    for(let i = 0; i < numFunctions; i++) { // iterate through functions
        const fIdx = startIdx + i;
        for(let j = 0; j < 2; j++) { // iterate through function targets
            const tIdx = state.FunctionTarget[(fIdx * 2) + j];
            if(tIdx >= 0) {
                const pos = unitPos[tIdx];
                ctx.drawImage( targetSprite, pos.X - 17, pos.Y - (h/4), w, h );
            }
        }
    }
}

export function drawTargetButton( ctx: CanvasRenderingContext2D ) {
    const totalWidth = buttons.length * buttonSize + (buttons.length - 1) * gap;
    const absLeftSide = cx - (totalWidth / 2);
    const topY = cy - 35 - buttonSize;

    for(let i = 0; i < buttons.length; i++) {
        const buttonLS = absLeftSide + (buttonSize + gap) * i;
        if(buttonTypes[i] === "Manual") { ctx.drawImage( swordIconSprite, buttonLS, topY ); }
        else { ctx.drawImage( targetIconSprite, buttonLS, topY ); }
    }
}

export function onTargetButton(px: number, py: number ) : boolean {

    const totalWidth = buttons.length * buttonSize + (buttons.length - 1) * gap;
    const absLeftSide = cx - (totalWidth / 2);
    const topY = cy - 35 - buttonSize;

    for(let i = 0; i < buttons.length; i++) {
        const buttonLS = absLeftSide + (buttonSize + gap) * i;
    
        if( 
            px >= buttonLS && 
            px <= buttonLS + buttonSize &&
            py >= topY && 
            py <= topY + buttonSize
        ){
            selectedButton = i;
            return true;
        } 

    }
    
    return false;
}

export function drawTargetSelectText( ctx: CanvasRenderingContext2D) {
    const count = buttonTypes[selectedButton].split(":")[1];
    ctx.fillStyle = "white"
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "10px sans-serif";
    if(count === "1") { ctx.fillText("select " + count + " target", cx, cy - 40); }
    else { ctx.fillText("select " + count + " targets", cx, cy - 40); }
    
}

