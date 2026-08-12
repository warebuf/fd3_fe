import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {

    state.Chain.pop();

    const card = state.Cards[log.CardIndex];
    if (card && card.Zone === Zone.Chain) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.CardIndex);
    }
    
}
