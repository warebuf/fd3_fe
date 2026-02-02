

import type { Atlas, Sprite } from './loadSprites';
import type { GameState } from '../../engine/gameState';



export function updateSprites( atlasMap : Record<number, Atlas>, sprites : Sprite[], gameState: GameState, dt: number ) {

    // update the sprites to match the gameState
    for(let i = sprites.length; i < gameState.ModelNo.length; i++) {
        const newSprite : Sprite = {
            durationIdx: 0,
            frameTime: 0,
        }
        sprites.push(newSprite)
    }

    // push the sprite animations forward by dt
    for(let i = 0; i < sprites.length; i++) {

        const modelNo = gameState.ModelNo[i];
        const boardState = gameState.Zone[i];
        const atlas = atlasMap[modelNo];
        const imageIdx = atlas.actionToImageIdx[boardState];
        const instructions = atlas.instructions[imageIdx];
        const durations = instructions.duration;

        if(sprites[i].durationIdx >= durations.length) {
            sprites[i].durationIdx = 0;
        }

        // do calculation
        sprites[i].frameTime += dt;
        while(sprites[i].frameTime >= durations[sprites[i].durationIdx] * 1000 / 30) {
            sprites[i].frameTime -= durations[sprites[i].durationIdx] * 1000 / 30;
            sprites[i].durationIdx = (sprites[i].durationIdx + 1) % durations.length;
        }

    }

}