

import { get } from "svelte/store";

import { serverClockOffset } from "../networking/ping";
import type { GameState } from './gameState';
import { PausePhase } from './gameState';

export function interpolate( authoritativeState : GameState, interpolatedState: GameState, currentTime: number ) : void {

    // interpolate
    const localizedTimestamp = authoritativeState.WallTimestamp - get(serverClockOffset);
    const millisecondsPassed = Math.floor(currentTime - localizedTimestamp);

    interpolateTimeBank(authoritativeState, interpolatedState, currentTime);
}

function interpolateTimeBank(authoritativeState: GameState, interpolatedState: GameState, currentTime: number) {
    const team = authoritativeState.TeamPaused;
    if (authoritativeState.PausePhase !== PausePhase.FullPause || team < 0) return;

    const elapsed = currentTime - authoritativeState.PauseStack[PausePhase.FullPause];
    interpolatedState.TimeBank[team] = Math.max(0, authoritativeState.TimeBank[team] - elapsed);
}
