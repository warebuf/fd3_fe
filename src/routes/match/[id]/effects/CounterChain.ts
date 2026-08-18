import type { GameState } from "../engine/gameState";
import { Zone, ChainItemType } from "../engine/gameState";
import type { CounterChainLog } from "../engine/logs";

export function counterChain(state: GameState, log: CounterChainLog) {

    const chainTop = state.Chain.pop();

    const card = state.Cards[log.TargetCardIndex];
    const type = chainTop?.Type;
    if (card && (type === ChainItemType.Trap || type === ChainItemType.Summon || type === ChainItemType.ContinuousResolution)) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.TargetCardIndex);
    }
}
