import type { GameState } from "../engine/gameState";
import type { PauseLog } from "../engine/logs";

export function pause(state: GameState, log: PauseLog) {

    state.PausePhase = log.PausePhase;
    state.PauseStack[log.PausePhase] = log.TimeStart;
    state.TeamPaused = log.TeamIndex;
    if (log.TeamIndex >= 0) {
        state.TimeBank[log.TeamIndex] = log.TimeRemaining;
    }
    
}
