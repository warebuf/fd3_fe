import type { GameState } from "../engine/gameState";
import type { UnpauseLog } from "../engine/logs";
import { PausePhase } from "../engine/gameState";

export function unpause(state: GameState, log: UnpauseLog) {
    const wallTime = log.WallTimestamp;
    const teamPaused = state.TeamPaused;

    if (state.PausePhase === PausePhase.SimPause) {
        state.SimPauseOffset += wallTime - state.PauseStack[PausePhase.SimPause];
        state.PauseStack[PausePhase.SimPause] = 0;
        state.PausePhase = PausePhase.Simulating;
        state.TeamPaused = -1;

    } else if (state.PausePhase === PausePhase.FullPause) {
        if (teamPaused >= 0) {
            state.TimeBank[teamPaused] = log.TimeRemaining;
        }
        state.FullPauseOffset += wallTime - state.PauseStack[PausePhase.FullPause];

        if (state.PauseStack[PausePhase.SimPause] > 0) { // full pause lifted but sim pause is still active underneath
            state.PausePhase = PausePhase.SimPause;
        } else if(state.PauseStack[PausePhase.SimPause] === 0) {
            state.SimPauseOffset += wallTime - state.PauseStack[PausePhase.FullPause];
            state.PausePhase = PausePhase.Simulating;
        }

        state.PauseStack[PausePhase.FullPause] = 0;
        state.TeamPaused = -1;
    }
}
