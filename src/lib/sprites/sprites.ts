


export type Instruction = {
    data: Record<string, number>
    duration: number[]
}

export type Sprite = {
    name: string
    images: Record<string, ImageBitmap>;
    instructions: Record<string, Instruction>
};

export async function createSprites(files: Record<string, string[]>): Promise<Sprite[]> {
    const start = performance.now();

    const sprites = await Promise.all(
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
            } satisfies Sprite;
        })
    );

  const end = performance.now();
  const duration = (end - start).toFixed(2);
  console.log(`🏁 Finished createSprites in ${duration} ms`);

  return sprites;
}

export function drawSprites(
  ctx: CanvasRenderingContext2D,
  sprites: Sprite[],
  active: { idx: number; imgIdx: number },
  width: number,
  height: number
) {
  const keys = Object.keys(sprites[active.idx].images);
  const bm0 = sprites[active.idx].images[keys[active.imgIdx]];

  // Compute centered image position
  const x = (width - bm0.width) / 2;
  const y = (height - bm0.height) / 2;

  // Draw the sprite
  ctx.drawImage(bm0, x, y);

  // Draw the label "test" below the image
  ctx.font = "15px sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  const textY = y + bm0.height + 50; // 24px below the image
  ctx.fillText(keys[active.imgIdx], width / 2, textY);
}