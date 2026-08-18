import type { GameState } from "../engine/gameState";
import { Zone, ChainItemType } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {

    const chainTop = state.Chain.pop();

    const card = state.Cards[log.CardIndex];
    const type = chainTop?.Type;
    if (card && (type === ChainItemType.Trap || type === ChainItemType.Summon || type === ChainItemType.ContinuousResolution)) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.CardIndex);
    }

}
