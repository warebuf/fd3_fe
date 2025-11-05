import type { Atlas, Sprite } from "./sprites";

let atlasIndex = 0;
let spriteList: Record<string, Sprite> = {};
let direction = 0;

export function incrementAtlas(atlases: Atlas[]) {
    spriteList = {};
    atlasIndex++;
    if( atlasIndex >= atlases.length ) { atlasIndex = 0; }
}

export function decrementAtlas(atlases: Atlas[]) {
    spriteList = {};
    atlasIndex--;
    if( atlasIndex < 0 ) { atlasIndex = atlases.length - 1; }
}

export function incrementDirection() {
    direction++;
    if( direction >= 8 ) { direction = 0; }
    for (const action in spriteList) {
        spriteList[action].direction = direction;
    }
}

export function decrementDirection() {
    direction--;
    if( direction < 8 ) { direction = 7; }
    for (const action in spriteList) {
        spriteList[action].direction = direction;
    }
}

export function drawAllSprites( 
    ctx: CanvasRenderingContext2D, 
    atlases: Atlas[],
    width: number, height: number,
    dt: number
) {

    if(atlases.length === 0) return;

    if( Object.keys(atlases[atlasIndex].instructions).length !== Object.keys(spriteList).length ) {
        for (const action in atlases[atlasIndex].instructions) {
            spriteList[action] = {atlasIdx: atlasIndex, durationIdx: 0, frameTime: 0, direction: direction}
        }
    }

    let x = 0;
    let y = 0;

    for (const action in atlases[atlasIndex].instructions) {
        
        const bitmap = atlases[atlasIndex].images[ action ];

        // get frame dimensions
        const frameWidth = atlases[atlasIndex].instructions[action].data["FrameWidth"];
        const frameHeight = atlases[atlasIndex].instructions[action].data["FrameHeight"];

        // compute top left corner
        const startX = spriteList[action].durationIdx * frameWidth;
        const startY = spriteList[action].direction * frameHeight;
        

        // Draw the label "test" below the image
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText(action, x, y + 10);

        // Draw the sprite
        ctx.drawImage(
            bitmap, 
            startX, startY, // top left corner of frame
            frameWidth, frameHeight, // frame dimensions
            x, y + 20, // destination coordinates
            frameWidth, frameHeight, // destination dimensions
        );


        // increment the frame
        spriteList[action].frameTime = spriteList[action].frameTime + dt;
        const durations = atlases[atlasIndex].instructions[action].duration;
        while (spriteList[action].frameTime >= durations[spriteList[action].durationIdx] * 1000 / 30) {
            spriteList[action].frameTime -= durations[spriteList[action].durationIdx] * 1000 / 30;
            spriteList[action].durationIdx = (spriteList[action].durationIdx + 1) % durations.length;
        }

        // increment the position
        x += 50;
        if(x > width) {
            x = 0;
            y += 120;
        }

    }

}