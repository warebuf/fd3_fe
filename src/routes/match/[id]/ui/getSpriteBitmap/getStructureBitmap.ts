

// 4 or 5
export async function getStructureBitmap(): Promise<ImageBitmap> {

    const url = `/structures/4.png`;
  
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch sprite: ${url}`);
  
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    return bmp;
  }