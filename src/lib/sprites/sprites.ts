


export type Sprite = {
    name: string
    images: Record<string, ImageBitmap>;
    instructions: string
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

                    const animEls = Array.from(anims.getElementsByTagName("Anim"));
                    for (const animEl of animEls) {
                        console.log(charName, "animEl", animEl);

                        console.log("animEl.children", animEl.children)


                    }
                    

                    return text;
                } catch (err) {
                    console.warn(`⚠️ No AnimData.xml found for ${charName}:`, err);
                    return "";
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
            const [_, animDataText] = await Promise.all([
                Promise.all(imagePromises),
                xmlPromise
            ]);

            return {
                name: charName,
                images,
                instructions: animDataText,
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