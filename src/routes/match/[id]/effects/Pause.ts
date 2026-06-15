import { PausePhase, type GameState } from "../engine/gameState";
import type { PauseLog } from "../engine/logs";

export function pause(state: GameState, log: PauseLog) {

    state.PausePhase = log.PausePhase;
    if (log.PausePhase === PausePhase.FullPause) {
        state.FullPauseStartedAt = log.TimeStart;
    } else {
        state.SimPauseStartedAt = log.TimeStart;
    }
    state.TeamPaused = log.TeamIndex;
    if (log.TeamIndex >= 0) {
        state.TimeBank[log.TeamIndex] = log.TimeRemaining;
    }
    
}
