import type { StandoffBidLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

// carries no Amount - that's the whole point, it stays secret until StandoffResolutionLog. Mark it
// sealed-but-hidden with -2, distinct from -1 ("hasn't bid yet"); the modal remembers our own
// submitted amount locally rather than echoing it into shared state, so this applies uniformly to
// both teams.
export function standoffBid(state: GameState, log: StandoffBidLog) {
    if (state.PendingBidAmount[log.TeamIndex] === -1) {
        state.PendingBidAmount[log.TeamIndex] = -2;
    }
}
