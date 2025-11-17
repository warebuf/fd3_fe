


export type Instruction = {
    RushFrames: number
    HitFrames: number
    ReturnFrames: number
    FrameHeight: number
    FrameWidth: number
    duration: number[]
}

export type Atlas = {
    actionToImageIdx: number[];
    images: ImageBitmap[];
    instructions: Instruction[];
};

export type SpriteDesc = {
    durationIdx: number // duration index
    frameTime: number // how many ms we are into the frame
};

async function createInstructionArr(name : string, actions: string[]) : Promise<Instruction[]> {

    const instructions: Instruction[] = [];
    const instructionsMap = new Map<string, Instruction>();

    // get XML file, parse it
    const xmlRes = await fetch(`/sprites/${name}/AnimData.xml`);
    if (!xmlRes.ok) throw new Error(`Failed to load XML ${name}`);
    const text = await xmlRes.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const parent = xml.getElementsByTagName("AnimData")[0];
    const child1 = parent.getElementsByTagName("Anims")[0];
    const children2 = Array.from(child1.getElementsByTagName("Anim"));

    for (const child2 of children2) {
        let instruction: Instruction = { 
            RushFrames: 0,
            HitFrames: 0,
            ReturnFrames: 0,
            FrameHeight: 0,
            FrameWidth: 0, 
            duration: [] 
        };
        let animName = "";

        const children3 = Array.from(child2.children);
        for (const child3 of children3) {
            const tag = child3.tagName;                         // e.g. "Name", "Index", "Durations"
            const textVal = child3.textContent?.trim() ?? "";

            if (tag === "Durations") {
                const durNodes = Array.from(child3.getElementsByTagName("Duration"));
                instruction.duration = durNodes.length > 0 ? durNodes.map(d => Number(d.textContent)) : textVal.split(/\s+/).filter(Boolean).map(Number);
            } else if (tag === "Name") {
                animName = textVal;
            } else if (tag === "RushFrames") {
                const n = Number(textVal);
                instruction.RushFrames = Number.isFinite(n) ? n : 0;
            } else if (tag === "HitFrames") {
                const n = Number(textVal);
                instruction.HitFrames = Number.isFinite(n) ? n : 0;
            } else if (tag === "ReturnFrames") {
                const n = Number(textVal);
                instruction.ReturnFrames = Number.isFinite(n) ? n : 0;
            } else if (tag === "FrameHeight") {
                const n = Number(textVal);
                instruction.FrameHeight = Number.isFinite(n) ? n : 0;
            } else if (tag === "FrameWidth") {
                const n = Number(textVal);
                instruction.FrameWidth = Number.isFinite(n) ? n : 0;
            }

        }
        instructionsMap.set(animName, instruction);
    }

    for(let i = 0; i < actions.length; i++) {
        instructions.push(instructionsMap.get(actions[i])!); 
    }

    return instructions;
}

async function createBitmaps(name: string, actions: string[]): Promise<ImageBitmap[]> {
    const promises = actions.map(async (action) => {
      const url = `/sprites/${name}/${action}-Anim.png`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load image: ${url}`);
      const blob = await res.blob();
      return await createImageBitmap(blob);
    });
  
    return Promise.all(promises);
  }

// gives an index to the first appearance of a string
// ie [a, b, a, c] => [0, 1, 0, 2]
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

export async function createAtlases2( files: Record<number, { name: string; anims: string[] }> ): Promise<Record<number, Atlas>> {

    const ans: Record<number, Atlas> = {};

    // init all keys
    for (const idxStr in files) {
        const idx = Number(idxStr);
        ans[idx] = { actionToImageIdx: createActionToImageIdx(files[idx].anims), images: [], instructions: []};
    }

    // create all promises
    const instructionPromises: Promise<any>[] = [];
    const bitmapPromises: Promise<any>[] = [];
    for (const idxStr in files) {
        const idx = Number(idxStr);
        const compressed = compressStrings(files[idx].anims);
        instructionPromises.push( createInstructionArr(files[idx].name, compressed) );
        bitmapPromises.push( createBitmaps(files[idx].name, compressed) );
    }

    const instructions = await Promise.all(instructionPromises);
    const bitmaps = await Promise.all(bitmapPromises);

    // save the maps
    let count = 0;
    for (const idxStr in files) {
        const idx = Number(idxStr);
        ans[idx].images = bitmaps[count];
        ans[idx].instructions = instructions[count];
        count++;
    }

    return ans;

}
