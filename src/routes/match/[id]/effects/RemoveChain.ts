import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { RemoveStackLog } from "../engine/logs";

export function removeStack(state: GameState, log: RemoveStackLog) {

    const i = state.ReactionStack.findIndex(item => item.CardIndex === log.CardIndex);
    if (i !== -1) state.ReactionStack.splice(i, 1);

    const card = state.Cards[log.CardIndex];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.CardIndex);
    }
    
}
