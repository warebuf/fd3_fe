
import type { Atlas, Sprite } from "./sprites";

let spriteList: Sprite[] = [];

export function drawIdles(
    ctx: CanvasRenderingContext2D, 
    atlases: Atlas[],
    benchAnimation: string[],
    width: number, height: number,
    dt: number
) {
    
    if(atlases.length != spriteList.length) {
        for(let i = 0; i < atlases.length; i++) {
            spriteList.push({atlasIdx: i, durationIdx: 0, frameTime: 0, direction: 0})
        }
    }

    const size = 36;       // box size
    const gap = 2;         // spacing between boxes
    const totalWidth = spriteList.length * size + (spriteList.length - 1) * gap;
    const startX = (width - totalWidth) / 2;

    for(let i = 0; i < spriteList.length; i++) {

        // get frame dimensions
        const frameWidth = atlases[spriteList[i].atlasIdx].instructions[benchAnimation[i]].data["FrameWidth"];
        const frameHeight = atlases[spriteList[i].atlasIdx].instructions[benchAnimation[i]].data["FrameHeight"];

        // calculate position on screen
        const x = startX + i * (size + gap);
        const y = height - size - 10;

        // shift the x, y so the sprite is centered
        const shiftX = x + (size / 2) - (frameWidth /2);
        const shiftY = y + (size / 2) - (frameHeight /2);

        // compute top left corner of sprite in spritesheet
        const sX = spriteList[i].durationIdx * frameWidth;
        const sY = spriteList[i].direction * frameHeight;

        ctx.drawImage(
            atlases[spriteList[i].atlasIdx].images[benchAnimation[i]], 
            sX, sY, // top left corner of frame
            frameWidth, frameHeight, // frame dimensions
            shiftX, shiftY + 3, // destination coordinates
            frameWidth, frameHeight, // destination dimensions
        );

        // increment the frame
        spriteList[i].frameTime = spriteList[i].frameTime + dt;
        const durations = atlases[spriteList[i].atlasIdx].instructions[benchAnimation[i]].duration;
        while (spriteList[i].frameTime >= durations[spriteList[i].durationIdx] * 1000 / 30) {
            spriteList[i].frameTime -= durations[spriteList[i].durationIdx] * 1000 / 30;
            spriteList[i].durationIdx = (spriteList[i].durationIdx + 1) % durations.length;
        }

    }

}