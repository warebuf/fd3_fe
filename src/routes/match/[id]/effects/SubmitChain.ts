import type { SubmitChainLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function submitChain(state: GameState, log: SubmitChainLog) {
    state.PendingSubmissions[log.TeamIndex] = log.CardIndex;
}
