import type { GameState } from "../engine/gameState";
import { Zone, CardStatus } from "../engine/gameState";
import type { CounterChainLog } from "../engine/logs";

export function counterChain(state: GameState, log: CounterChainLog) {
    const i = state.Chain.findIndex(item => item.CardID === log.TargetCardID);
    if (i !== -1) state.Chain.splice(i, 1);

    const card = state.Cards[log.TargetCardID];
    if (card && card.Zone === Zone.Chain) {
        card.Zone = Zone.Graveyard;
        card.Status = CardStatus.Default;
        state.Grave[card.Team].push(log.TargetCardID);
    }
}
