import type { ClearPendingChainsLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function clearPendingChains(state: GameState, _log: ClearPendingChainsLog) {
    for (let i = 0; i < state.PendingSubmissions.length; i++) {
        state.PendingSubmissions[i] = -1;
    }
}
