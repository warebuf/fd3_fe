import { PausePhase, type GameState } from "../engine/gameState";
import type { PauseLog } from "../engine/logs";
import { get } from "svelte/store";
import { serverClockOffset } from "../networking/ping";
import { debugDump } from "../debug";

export function pause(state: GameState, log: PauseLog) {

    state.PausePhase = log.PausePhase;
    if (log.PausePhase === PausePhase.FullPause) {
        state.FullPauseStartedAt = log.TimeStart;
        const M = 1e7; 
        debugDump(`Pause: now=${(Date.now()+get(serverClockOffset))%M} PauseStart=${log.TimeStart%M} SimPauseOffset=${state.SimPauseOffset} frozenSimTime=${(log.TimeStart - state.SimPauseOffset)%M}`);
    } else {
        state.SimPauseStartedAt = log.TimeStart;
    }
    state.TeamPaused = log.TeamIndex;
    if (log.TeamIndex >= 0) {
        state.TimeBank[log.TeamIndex] = log.TimeRemaining;
    }
    
}
