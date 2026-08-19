// simple icon cache: load once, draw many. sources live in static/sprites.

export enum Icon {
    Charge,
}

// indexed by Icon
const PATHS = [
    "/sprites/puzzle_red_2.png",
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

// call once from onMount, before the first frame. never awaited on the render path.
export function preloadIcons(): Promise<unknown> {
    return Promise.all(PATHS.map((_, icon) => get(icon).decode().catch(() => {})));
}

// draws centered on (x, y) at w x h css px. returns false if the image isn't loaded yet,
// so callers keep their vector fallback and the board never renders blank.
export function drawIcon(ctx: CanvasRenderingContext2D, icon: Icon, x: number, y: number, w: number, h: number): boolean {
    const img = get(icon);
    if (!img.complete) return false;
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    return true;
}
