// simple icon cache: load once, draw many. sources live in static/sprites.

export enum Icon {
    PuzzleRed,
}

// 1:1 with Icon enum
const PATHS = [
    "/sprites/puzzle_red-12.png",
];

const images: HTMLImageElement[] = [];

function get(icon: Icon): HTMLImageElement {
    let img = images[icon];
    if (!img) {
        img = new Image();
        img.src = PATHS[icon];
        images[icon] = img;
    }
    return img;
}

export function preloadIcons(): Promise<unknown> {
    return Promise.all(PATHS.map((_, icon) => get(icon).decode().catch(() => {})));
}

// draws at the image's natural size, from x, y as the top left corner
export function drawIcon(ctx: CanvasRenderingContext2D, icon: Icon, x: number, y: number): boolean {
    const img = get(icon);
    if (!img.complete) return false;
    ctx.drawImage(img, Math.round(x), Math.round(y));
    return true;
}
