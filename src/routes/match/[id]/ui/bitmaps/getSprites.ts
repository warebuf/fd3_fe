
// right now these set of functions are designed to load all sprites 
// there is a strategy to get this right, not sure what it is, 

export type Instruction = { 
    Width: number; 
    Height: number; 
    Duration: number[]; 
    HitFrame: number; 
}

export type Atlas = { 
    actionToImageIdx: number[]; 
    images: ImageBitmap[]; 
    instructions: Instruction[]; 
} 

export type Sprite = { 
    durationIdx: number; 
    frameTime: number; // how many ms we are into the frame 
}; 

import csvText from "./sprites.csv?raw"; // can import csvs as a string in vite 

function getSpriteActions() : string[][] {

    const lines = csvText.trim().split("\n");
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        let ok = true;

        for (let j = 0; j < row.length; j++) {
            if (row[j].trim() === "") {
                ok = false;
                break;
            }
        }

        if (ok) result.push(row);
    }

    return result;

}

function compressStrings(arr: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const s of arr) {
        if (!seen.has(s)) {
            seen.add(s);
            result.push(s);
        }
    }

    return result;
}

export async function loadSprites() { 
    
    // parse the JSON into an arr of arr of strings 
    const actions : string[][] = getSpriteActions();
    
    const instructionPromises : Promise<any>[] = []; 
    const bitmapPromises : Promise<any>[] = []; 
    const promisesIndex = []; 
    for(let i = 0; i < actions.length; i++) {

        // compress the strings 
        const compressed = compressStrings(actions[i]); 
        
        // iterate through the compressed, get the instructions and bitmaps 
        for(let j = 0; j < compressed.length; j++) { 
            instructionPromises.push( getInstruction(i, compressed[j]) ); 
            bitmapPromises.push( getBitmap(i, compressed[j]) ); 
            promisesIndex.push( i ); 
        } 
    } 
    
    const instructions = await Promise.all(instructionPromises); 
    const bitmaps = await Promise.all(bitmapPromises); // something to do with putting the objects into a map 

    //
    const ans: Record<number, Atlas> = {};

}

