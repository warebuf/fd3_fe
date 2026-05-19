import type { GameState } from "../engine/gameState";
import type { PauseLog } from "../engine/logs";

export function pause(state: GameState, log: PauseLog) {
    state.TeamPaused = log.TeamIndex;
    state.TimeBank[log.TeamIndex] = log.TimeRemaining;
}
