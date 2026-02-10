

import type { GameState } from "../../engine/gameState"


export function calcPlayerBench( currentState: GameState, teamIdx : number ) : number[] {

    let benchUnits : number[] = []; // save idx
    for(let i = 0; i < currentState.Team.length; i++) {
        if( currentState.Zone[i] === 0 ) { // on bench
            if(currentState.Team[i] === teamIdx) {
                benchUnits.push(i);
            }
        }
    }

    return benchUnits;
}