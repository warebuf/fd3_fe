


export type Instruction = {
    data: Record<string, number>
    duration: number[]
}

export type Atlas = {
    name: string
    images: Record<string, ImageBitmap>;
    instructions: Record<string, Instruction>
};

export type Sprite = {
    atlasIdx: number // which atlas to draw
    durationIdx: number // duration index
    frameTime: number // how many ms we are into the frame
    direction: number // 0: down, 1: dr, 2: right, 3: ur, 4: up, 5: ul, 6: left, 7: dl
}

async function createInstructionMap(name : string, actions: string[]) : Promise<Record<string, Instruction>> {

    const instructions: Record<string, Instruction> = {};

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
        const instruction: Instruction = { data: {}, duration: [] };
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
            } else if (tag === "CopyOf" || tag === "Index") {
            } else {
                const n = Number(textVal);
                instruction.data[tag] = Number.isFinite(n) ? n : 0;
            }
        }

        if (actions.includes(animName)) {
            instructions[animName] = instruction
        }

    }

    return instructions;
}

async function createBitmaps(name : string, actions : string[]) : Promise<Record<string, ImageBitmap>> {

    const imageBitmaps: Record<string, ImageBitmap> = {};

    for(let i = 0; i < actions.length; i++) {
        const url = `/sprites/${name}/${actions[i]}-Anim.png`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load image: ${url}`);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);
        imageBitmaps[actions[i]] = bitmap;
    }
    
    return imageBitmaps;

}

export async function createAtlases2( files: Record<number, { name: string; anims: string[] }> ): Promise<Record<number, Atlas>> {

    const ans: Record<number, Atlas> = {};

    // init all keys
    for (const idxStr in files) {
        ans[Number(idxStr)] = { name: files[Number(idxStr)].name, images: {}, instructions: {}};
    }

    // create all promises
    const instructionPromises: Promise<any>[] = [];
    const bitmapPromises: Promise<any>[] = [];
    for (const idxStr in files) {
        const idx = Number(idxStr);
        instructionPromises.push( createInstructionMap(files[idx].name, files[idx].anims) );
        bitmapPromises.push( createBitmaps(files[idx].name, files[idx].anims) );
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

export async function createAtlases(files: Record<string, string[]>): Promise<Atlas[]> {
    const start = performance.now();

    const atlases = await Promise.all(
        Object.entries(files).map(async ([charName, bases]) => {
            const images: Record<string, ImageBitmap> = {};

            // Start XML fetch immediately (non-blocking)
            const xmlPromise = (async () => {
                try {
                    const xmlRes = await fetch(`/sprites/${charName}/AnimData.xml`);
                    if (!xmlRes.ok) throw new Error(`Failed to load XML ${charName}`);
                    const text = await xmlRes.text();

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, "application/xml");
                    const root = xmlDoc.getElementsByTagName("AnimData")[0];
                    const anims = root.getElementsByTagName("Anims")[0];

                    const instructions: Record<string, Instruction> = {};

                    const animEls = Array.from(anims.getElementsByTagName("Anim"));
                    for (const animEl of animEls) {
                        const children = Array.from(animEl.children);

                        const instruction: Instruction = { data: {}, duration: [] };
                        let animName = "";

                        for (const child of children) {
                            const tag = child.tagName;                         // e.g. "Name", "Index", "Durations"
                            const textVal = child.textContent?.trim() ?? "";

                            if (tag === "Durations") {
                                const durNodes = Array.from(child.getElementsByTagName("Duration"));
                                instruction.duration = durNodes.length > 0 ? durNodes.map(d => Number(d.textContent)) : textVal.split(/\s+/).filter(Boolean).map(Number);
                            } else if (tag === "Name") {
                                animName = textVal;
                            } else if (tag === "CopyOf" || tag === "Index") {
                            } else {
                                const n = Number(textVal);
                                instruction.data[tag] = Number.isFinite(n) ? n : 0;
                            }
                        }

                        if (animName && instruction.duration.length > 0) {
                            instructions[animName] = instruction;
                        }
                    }

                    return instructions;
                } catch (err) {
                    console.warn(`No AnimData.xml found for ${charName}:`, err);
                    return {} as Record<string, Instruction>;
                }
            })();

            // Start all image fetches in parallel
            const imagePromises = bases.map(async (baseName) => {
                const url = `/sprites/${charName}/${baseName}-Anim.png`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to load image: ${url}`);
                const blob = await res.blob();
                const bitmap = await createImageBitmap(blob);
                images[baseName] = bitmap;
            });

            // Wait for both (images + XML)
            const [_, instructions] = await Promise.all( [Promise.all(imagePromises), xmlPromise] );

            return {
                name: charName,
                images,
                instructions, 
            } satisfies Atlas;
        })
    );

    const end = performance.now();
    const duration = (end - start).toFixed(2);
    console.log(`Finished createAtlases in ${duration} ms`);

    return atlases;
}

