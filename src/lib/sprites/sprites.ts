


export type Sprite = {
    name: string
    images: Record<string, ImageBitmap[]>;
};

export async function createSprites(files: Record<string, string[]>): Promise<Sprite[]> {
    
    
    const sprites = await Promise.all(
        Object.entries(files).map(async ([charName, bases]) => {
            const images: Record<string, ImageBitmap[]> = {};
        
            // Load each animation "base" (e.g., "idle", "attack")
            await Promise.all(
                bases.map(async (baseName) => {
                const urls = [
                    `/sprites/${charName}/${baseName}-Anim.png`,
                    `/sprites/${charName}/${baseName}-Offsets.png`,
                    `/sprites/${charName}/${baseName}-Shadow.png`,
                ];
        
                // Fetch all three layers in parallel
                const bitmaps = await Promise.all(
                    urls.map(async (url) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed to load image: ${url}`);
                    const blob = await res.blob();
                    return await createImageBitmap(blob);
                    })
                );
        
                // Store under the baseName key
                images[baseName] = bitmaps; // [Anim, Offsets, Shadow]
                })
            );
        
            return {
                name: charName,
                images,
            } satisfies Sprite;
        })
    );
  
    return sprites;
}

export function drawSprites(
    ctx: CanvasRenderingContext2D, 
    sprites: Sprite[], 
    active: { idx: number, imgIdx: number},
    width: number, 
    height: number
) {
    
    const keys = Object.keys(sprites[active.idx].images);


    const bm2 = sprites[active.idx].images[keys[active.imgIdx]][2];
    ctx.drawImage(bm2, (width - bm2.width) / 2, (height - bm2.height) / 2);

    const bm0 = sprites[active.idx].images[keys[active.imgIdx]][0];
    ctx.drawImage(bm0, (width - bm0.width) / 2, (height - bm0.height) / 2);

    const bm1 = sprites[active.idx].images[keys[active.imgIdx]][1];
    ctx.drawImage(bm1, (width - bm1.width) / 2, (height - bm1.height) / 2);

}