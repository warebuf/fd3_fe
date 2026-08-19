import type { GameState } from "../engine/gameState";
import type { PurgeChainLog } from "../engine/logs";

// removes a chain item outside the normal top-of-chain pop, e.g. its source card was destroyed;
// the card's own zone/grave bookkeeping is handled by whichever log reported that destruction
export function purgeChain(state: GameState, log: PurgeChainLog) {
    const idx = state.Chain.findIndex(item => item.CardIndex === log.CardIndex);
    if (idx !== -1) state.Chain.splice(idx, 1);
}
