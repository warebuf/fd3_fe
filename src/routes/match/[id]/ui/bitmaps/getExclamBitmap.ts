

export async function getExclamBitmap(): Promise<ImageBitmap> {

    const url = `/emotions/exclam1.png`;
  
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch sprite: ${url}`);
  
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    return bmp;
  }