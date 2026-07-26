import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { RemoveStackLog } from "../engine/logs";

export function removeStack(state: GameState, log: RemoveStackLog) {

    state.ReactionStack.pop();

    const card = state.Cards[log.CardIndex];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.CardIndex);
    }
    
}
