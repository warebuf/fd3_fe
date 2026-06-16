import type { GameState } from "../engine/gameState";
import type { UnpauseLog } from "../engine/logs";
import { PausePhase } from "../engine/gameState";
import { get } from "svelte/store";
import { serverClockOffset } from "../networking/ping";

export function unpause(state: GameState, log: UnpauseLog) {
    const wallTime = log.WallTimestamp;
    const teamPaused = state.TeamPaused;

    if (state.PausePhase === PausePhase.SimPause) {
        state.SimPauseOffset += wallTime - state.SimPauseStartedAt;
        state.SimPauseStartedAt = 0;
        state.PausePhase = PausePhase.Simulating;
        state.TeamPaused = -1;

    } else if (state.PausePhase === PausePhase.FullPause) {
        const M = 1e7; console.log('Unpause: now=', (Date.now()+get(serverClockOffset))%M, 'WallTimestamp=', log.WallTimestamp%M, 'FullPauseStartedAt=', state.FullPauseStartedAt%M, 'SimPauseOffset=', state.SimPauseOffset, 'resumeSimTime=', (state.FullPauseStartedAt - state.SimPauseOffset)%M);
        if (teamPaused >= 0) {
            state.TimeBank[teamPaused] = log.TimeRemaining;
        }
        state.FullPauseOffset += wallTime - state.FullPauseStartedAt;

        if (state.SimPauseStartedAt > 0) { // full pause lifted but sim pause is still active underneath
            state.PausePhase = PausePhase.SimPause;
        } else if(state.SimPauseStartedAt === 0) {
            state.SimPauseOffset += wallTime - state.FullPauseStartedAt;
            state.PausePhase = PausePhase.Simulating;
        }

        state.FullPauseStartedAt = 0;
        state.TeamPaused = -1;
    }
}
