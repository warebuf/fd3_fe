import type { StandoffBidLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

// carries no Amount/Choice - that's the whole point, it stays secret until StandoffResolutionLog.
// If we don't already know this team's choice (e.g. it isn't our own optimistically-set value),
// mark it sealed-but-hidden with -2, distinct from -1 ("hasn't bid yet").
export function standoffBid(state: GameState, log: StandoffBidLog) {
    if (state.PendingBidChoice[log.TeamIndex] === -1) {
        state.PendingBidChoice[log.TeamIndex] = -2;
    }
}
