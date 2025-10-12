


export type Sprite = {
    name: string
    images: ImageBitmap[];
};

export async function createBitmaps(files: Record<string, string[]>): Promise<Sprite[]> {
    
    const sprites = await Promise.all(
      Object.entries(files).map(async ([charName, paths]) => {
        // Load this character's images in parallel
        const bitmaps = await Promise.all(
          paths.map(async (fileName) => {
            // Build the full image path
            const filePath = `/sprites/${charName}/${fileName}`;
  
            const res = await fetch(filePath);
            if (!res.ok) throw new Error(`Failed to load image: ${filePath}`);
  
            const blob = await res.blob();
            return await createImageBitmap(blob);
          })
        );
  
        // Return sprite object for this character
        return {
          name: charName,
          images: bitmaps,
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

    ctx.drawImage(sprites[active.idx].images[active.imgIdx], (width - sprites[active.idx].images[active.imgIdx].width) / 2, (height - sprites[active.idx].images[active.imgIdx].height) / 2);

}