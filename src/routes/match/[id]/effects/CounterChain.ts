import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { CounterChainLog } from "../engine/logs";

export function counterChain(state: GameState, log: CounterChainLog) {

    state.Chain.pop();

    const card = state.Cards[log.TargetCardIndex];
    if (card && card.Zone === Zone.Chain) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.TargetCardIndex);
    }
}
