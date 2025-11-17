

import type { SpriteDesc } from "$lib/sprites/sprite2"
import type { GameState } from '../engine/gameState';


export function updateSprites( sprites : SpriteDesc[], gameState: GameState, dt: number ) {

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
        // get duration
        
        // do calculation

        
    }

}