

import { get } from "svelte/store";

import { serverClockOffset } from "../networking/ping";
import type { GameState } from './gameState';

export function interpolate( authoritativeState : GameState, interpolatedState: GameState, currentTime: number ) : void {
    
    // interpolate
    const localizedTimestamp = authoritativeState.WallTimestamp - get(serverClockOffset);
    const millisecondsPassed = Math.floor(currentTime - localizedTimestamp); 

    // placeholder: update all fields in the interpolated state based on our new time

}
