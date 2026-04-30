
import type { GameState } from "../engine/gameState";
import type { RemoveStackLog } from "../engine/logs";

export function removeStack(state: GameState, log: RemoveStackLog) {
    for(let i = 0; i < state.ReactionPQ.Items.length; i++) {
        if(state.ReactionPQ.Items[i].StackID === log.StackID) {
            state.ReactionPQ.Items.splice(i, 1);
            return;
        }
    }
}
