

import { get } from "svelte/store";

import { serverClockOffset } from "../networking/ping";
import type { GameState } from './gameState';
import { PausePhase } from './gameState';

export function interpolate( authoritativeState : GameState, interpolatedState: GameState, currentTime: number ) : void {
    interpolateTimeBank(authoritativeState, interpolatedState, currentTime);
}

function interpolateTimeBank(authoritativeState: GameState, interpolatedState: GameState, currentTime: number) {
    const team = authoritativeState.TeamPaused;
    if (authoritativeState.PausePhase !== PausePhase.FullPause || team < 0) return;

    const localPauseStart = authoritativeState.PauseStack[PausePhase.FullPause] - get(serverClockOffset);
    const elapsed = currentTime - localPauseStart;
    interpolatedState.TimeBank[team] = Math.max(0, authoritativeState.TimeBank[team] - elapsed);
}
