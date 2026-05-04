
import type { GameState } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {
    for(let i = 0; i < state.ReactionPQ.Items.length; i++) {
        if(state.ReactionPQ.Items[i].ChainID === log.ChainID) {
            state.ReactionPQ.Items.splice(i, 1);
            return;
        }
    }
}
