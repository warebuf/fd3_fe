import type { StandoffResolutionLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

// the loser's forced discard, if any, arrives as its own separate DiscardLog in the same batch;
// this just reveals both bids and retires the trap. Deliberately doesn't reset PendingBidAmount
// back to [-1,-1] (the server already has) so the reveal stays on screen - nothing gates on it
// once StandoffCardIndex is back to -1.
export function standoffResolution(state: GameState, log: StandoffResolutionLog) {
    state.PendingBidAmount = [...log.Bids];

    const card = state.Cards[log.CardIndex];
    if (card) {
        card.Zone = Zone.Graveyard;
        if (!card.IsToken) state.Grave[card.Team].push(log.CardIndex);
    }

    state.StandoffCardIndex = -1;
}
