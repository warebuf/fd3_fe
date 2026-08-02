
import type { PhaseLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function incrementPhase(state: GameState, log: PhaseLog) {

    state.Phase = log.Phase;
    state.PhaseEndInActiveTime = log.PhaseEndInActiveTime;

}