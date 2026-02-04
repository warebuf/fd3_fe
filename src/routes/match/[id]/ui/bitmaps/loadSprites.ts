
// right now these set of functions are designed to load all sprites 
// there is a strategy to get this right, not sure what it is, 

export type Instruction = { 
    width: number; 
    height: number; 
    duration: number[]; 
    hitFrame: number; 
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

    const lines = csvText.trim().replace(/\r/g, "").split("\n");
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const elements = lines[i].split(",");
        let ok = true;

        for (let j = 0; j < elements.length; j++) { // if any of the elements are empty, add an empty arr
            if (elements[j].trim() === "" || elements[j].trim() === '') {
                ok = false;
                break;
            }
        }

        if(ok) {
            result.push(elements);
        } else {
            result.push([]);
        }
        
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

async function createBitmaps(idx: string, compressed: string[]): Promise<ImageBitmap[]> {
    const promises = compressed.map(async (action) => {
      const url = `/sprites/${idx}/${action}.png`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load image: ${url}`);
      const blob = await res.blob();
      return await createImageBitmap(blob);
    });
  
    return Promise.all(promises);
}

async function createInstructions(idx: string, compressed: string[]) : Promise<Instruction[]> {
    
    if(compressed.length === 0) {
        return [];
    }

    const res = await fetch(`/sprites/${idx}/.csv`);

    if (!res.ok) {
        return [];
    }

    const csv = await res.text();


    const lines = csv.split("\n");

    const instructionMap : Record<string, Instruction> = {}
    for(let i = 1; i < lines.length; i++) {

        const fields = lines[i].split(",");

        const name = fields[0];

        const width = Number(fields[1]);
        const height = Number(fields[2]);

        let hitFrame = -1;
        if(fields[3].length > 0) {
            hitFrame = Number(fields[3]);
        }

        const durStr = fields[4].replace(/"/g, "");
        const durArr = durStr.split(";");        
        const duration = durArr.map(Number);

        instructionMap[name] = {
            width: width,
            height: height,
            hitFrame: hitFrame,
            duration: duration
        }

    }

    const instructions: Instruction[] = [];
    for(let i = 0; i < compressed.length; i++) {
        instructions.push(instructionMap[compressed[i]]);
    }

    return instructions;

}

function createActionToImageIdx(anims: string[]) : number[] {
    const indexMap = new Map<string, number>();
    let count = 0;
    let ans : number[] = [];

    for(let i = 0; i < anims.length; i++) {
        if(!indexMap.has(anims[i])) {
            indexMap.set(anims[i], count);
            ans.push(count);
            count++;
        } 
        else { 
            ans.push(indexMap.get(anims[i])!); 
        }
    }

    return ans;
}

export async function loadSprites() : Promise<Record<number, Atlas>> { 
    
    // parse the JSON into an arr of arr of strings 
    const actions : string[][] = getSpriteActions();
    
    const instructionPromises : Promise<any>[] = []; 
    const bitmapPromises : Promise<any>[] = []; 
    for(let i = 0; i < actions.length; i++) {
        const compressed = compressStrings(actions[i]); // compress strings
        instructionPromises.push( createInstructions(i.toString(), compressed) ); 
        bitmapPromises.push( createBitmaps(i.toString(), compressed) ); 
    } 
    
    const instructions = await Promise.all(instructionPromises); 
    const bitmaps = await Promise.all(bitmapPromises); // something to do with putting the objects into a map 

    const ans: Record<number, Atlas> = {};
    for(let i = 0; i < actions.length; i++) {
        ans[i] = {
            actionToImageIdx: createActionToImageIdx(actions[i]),
            images: bitmaps[i],
            instructions: instructions[i],
        }
    }

    console.log(ans)

    return ans;

}

