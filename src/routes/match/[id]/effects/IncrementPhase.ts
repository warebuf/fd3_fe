
import type { PhaseLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function incrementPhase(state: GameState, log: PhaseLog) {

    state.Phase = log.Phase;

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}