


export type Sprite = {
  
    image: ImageBitmap;
  
};




export async function createBitmaps(paths: string[]): Promise<Sprite[]> {
  
    // creates all sprites asynchronously
    const sprites = await Promise.all(
        
        paths.map(async (path) => {

            // fetch file
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Failed to load image: ${path}`);
            
            // convert to blob
            const blob = await res.blob();

            // create bitmap
            const imageBM =  await createImageBitmap(blob);

            // create sprite
            const sprite: Sprite = {
                image: imageBM
            }

            return sprite;

        })

    );

  return sprites;

}

export function drawSprites(ctx: CanvasRenderingContext2D, sprites: Sprite[], width: number, height: number) {

    for(let i = 0; i < sprites.length; i++) {
      ctx.drawImage(sprites[i].image, (width - sprites[i].image.width) / 2, (height - sprites[i].image.height) / 2);
    }

}