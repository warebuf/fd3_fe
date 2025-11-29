

import { get } from "svelte/store";

import { serverClockOffset } from "../networking/ping";
import type { GameState } from './gameState';

export function interpolate( authoritativeState : GameState, interpolatedState: GameState, currentTime: number ) : void {
    
    // interpolate
    const localizedTimestamp = authoritativeState.Timestamp - get(serverClockOffset);
    const millisecondsPassed = Math.floor(currentTime - localizedTimestamp); 
    console.log(millisecondsPassed)

    for(let i = 0; i < authoritativeState.HP.length; i++) {

        // for now just update charge of on field units, obviously amendable in the ufture

        if( authoritativeState.HP[i] > 0 && authoritativeState.Zone[i] === 1) {
            for( let j = authoritativeState.AbilityStartIdx[i]; j < authoritativeState.AbilityStartIdx[i] + authoritativeState.AbilityCount[i]; j++ ) {
                interpolatedState.AbilityCharge[j] = authoritativeState.AbilityCharge[j] + millisecondsPassed;
                if(interpolatedState.AbilityCharge[j] > interpolatedState.AbilitySPD[j]) {
                    interpolatedState.AbilityCharge[j] = interpolatedState.AbilitySPD[j];
                }
            }
        }

    }

}
