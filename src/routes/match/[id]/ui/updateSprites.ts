

import type { SpriteDesc, Atlas } from "$lib/sprites/sprite2"
import type { GameState } from '../engine/gameState';



export function updateSprites( atlasMap : Record<number, Atlas>, sprites : SpriteDesc[], gameState: GameState, dt: number ) {

    // update the sprites to match the gameState
    for(let i = sprites.length; i < gameState.ModelNo.length; i++) {
        const newSprite : SpriteDesc = {
            durationIdx: 0,
            frameTime: 0,
        }
        sprites.push(newSprite)
    }

    // push the sprite animations forward by dt
    for(let i = 0; i < sprites.length; i++) {
        
        // get modelNo
        const modelNo = gameState.ModelNo[i];
        const boardState = gameState.Zone[i];
        const atlas = atlasMap[modelNo];
        const imageIdx = atlas.actionToImageIdx[boardState];
        const instructions = atlas.instructions[imageIdx];
        const durations = instructions.duration;
        
        console.log("updateSprites", i, "modelNo", modelNo, "boardState", boardState, "imageIdx", imageIdx, "sprites[i].durationIdx", sprites[i].durationIdx, "durations", durations);

        // do calculation
        sprites[i].frameTime += dt;
        while(sprites[i].frameTime >= durations[sprites[i].durationIdx] * 1000 / 15) {
            sprites[i].frameTime -= durations[sprites[i].durationIdx] * 1000 / 15;
            sprites[i].durationIdx = (sprites[i].durationIdx + 1) % durations.length;
        }

    }

}