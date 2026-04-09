
import type { EventLog } from "../engine/stateManager";
import type { GameState } from "../engine/gameState"

// A: phase 
export function incrementPhase(state: GameState, log: EventLog) {

    console.log("called incrementPhase")

    state.Phase = log.A;

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}