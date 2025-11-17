

import type { SpriteDesc } from "$lib/sprites/sprite2"
import type { GameState } from '../engine/gameState';


export function updateSprites( sprites : SpriteDesc[], gameState: GameState, dt: number ) {

    // update the sprites to match the gameState
    console.log(gameState.ModelNo);

    // push the sprite animations forward by dt

}