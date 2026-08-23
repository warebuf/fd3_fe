import type { GameState } from "../engine/gameState";
import { Zone, ChainItemType } from "../engine/gameState";
import type { RemoveChainLog } from "../engine/logs";

export function removeChain(state: GameState, log: RemoveChainLog) {

    const chainTop = state.Chain.pop();

    const card = state.Cards[log.CardIndex];
    const type = chainTop?.Type;
    if (!card) return;

    if (type === ChainItemType.Trap) {
        if (card.Zone === Zone.Trap) {
            const trapIdx = state.Traps[card.Team].indexOf(log.CardIndex);
            if (trapIdx !== -1) state.Traps[card.Team].splice(trapIdx, 1);
            card.Zone = Zone.Graveyard;
            state.Grave[card.Team].push(log.CardIndex);
        }
    } else if (type === ChainItemType.Summon || type === ChainItemType.ContinuousResolution || type === ChainItemType.Equip) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.CardIndex);
    }

}
