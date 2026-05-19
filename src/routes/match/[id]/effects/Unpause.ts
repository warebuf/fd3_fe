import type { GameState } from "../engine/gameState";
import type { UnpauseLog } from "../engine/logs";

export function unpause(state: GameState, log: UnpauseLog) {
    state.TimeBank[log.TeamIndex] = log.TimeRemaining;
}
