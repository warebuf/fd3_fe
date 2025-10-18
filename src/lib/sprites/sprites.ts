


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
    imgIdx: number // index of image in the atlas
    durationIdx: number // duration index
    frameTime: number // how many ms we are into the frame
    direction: number // 0: down, 1: dr, 2: right, 3: ur, 4: up, 5: ul, 6: left, 7: dl
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
                    console.warn(`⚠️ No AnimData.xml found for ${charName}:`, err);
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
            const [_, instructions] = await Promise.all([
            Promise.all(imagePromises),
            xmlPromise,
            ]);

            return {
            name: charName,
            images,
            instructions, 
            } satisfies Atlas;
        })
    );

  const end = performance.now();
  const duration = (end - start).toFixed(2);
  console.log(`🏁 Finished createAtlases in ${duration} ms`);

  return atlases;
}

export function drawSprites( 
    ctx: CanvasRenderingContext2D, 
    atlases: Atlas[], 
    sprite: Sprite, 
    width: number, height: number,
    dt: number
) {
    
    const keys = Object.keys(atlases[sprite.atlasIdx].images);
    const bitmap = atlases[sprite.atlasIdx].images[keys[sprite.imgIdx]];

    // get frame dimensions
    const frameWidth = atlases[sprite.atlasIdx].instructions[keys[sprite.imgIdx]].data["FrameWidth"];
    const frameHeight = atlases[sprite.atlasIdx].instructions[keys[sprite.imgIdx]].data["FrameHeight"];

    // compute top left corner
    const startX = sprite.durationIdx * frameWidth;
    const startY = sprite.direction * frameHeight;

    // compute center
    const destX = (width - frameWidth) / 2;
    const destY = (height - frameHeight) / 2;

    // Draw the sprite
    ctx.drawImage(
        bitmap, 
        startX, startY, // top left corner of frame
        frameWidth, frameHeight, // frame dimensions
        destX, destY, // destination coordinates
        frameWidth, frameHeight, // destination dimensions
    );

    // Draw the label "test" below the image
    ctx.font = "15px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    const textY = destY + frameHeight + 10; // 24px below the image
    ctx.fillText(keys[sprite.imgIdx], width / 2, textY);

    // increment the frame
    
    sprite.frameTime = sprite.frameTime + dt;

    const durations = atlases[sprite.atlasIdx].instructions[keys[sprite.imgIdx]].duration;
    while (sprite.frameTime >= durations[sprite.durationIdx] * 1000 / 30) {
        sprite.frameTime -= durations[sprite.durationIdx] * 1000 / 30;
        sprite.durationIdx = (sprite.durationIdx + 1) % durations.length;
    }

}