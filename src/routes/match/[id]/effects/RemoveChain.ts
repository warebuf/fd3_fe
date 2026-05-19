import type { GameState } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {
    const i = state.Chain.findIndex(item => item.CardID === log.CardID);
    if (i !== -1) state.Chain.splice(i, 1);
}
