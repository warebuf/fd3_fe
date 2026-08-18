import type { GameState } from "../engine/gameState";
import { Zone, ChainItemType } from "../engine/gameState";
import type { CounterChainLog } from "../engine/logs";

export function counterChain(state: GameState, log: CounterChainLog) {

    const chainTop = state.Chain.pop();

    const card = state.Cards[log.TargetCardIndex];
    const type = chainTop?.Type;
    if (!card) return;

    if (type === ChainItemType.Trap) {
        if (card.Zone === Zone.Trap) {
            const trapIdx = state.Traps[card.Team].indexOf(log.TargetCardIndex);
            if (trapIdx !== -1) state.Traps[card.Team].splice(trapIdx, 1);
            card.Zone = Zone.Graveyard;
            state.Grave[card.Team].push(log.TargetCardIndex);
        }
    } else if (type === ChainItemType.Summon || type === ChainItemType.ContinuousResolution) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.TargetCardIndex);
    }
}
