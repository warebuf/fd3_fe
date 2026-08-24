import type { GameState } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {
    state.Chain.pop();
}
