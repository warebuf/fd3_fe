import type { DiscardLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function discard(state: GameState, log: DiscardLog) {
    const cardIndex = log.CardIndex;
    const teamIndex = log.TeamIndex;
    const card = state.Cards[cardIndex];
    if (!card) return;

    const handIdx = state.Hand[teamIndex].indexOf(cardIndex);
    if (handIdx !== -1) state.Hand[teamIndex].splice(handIdx, 1);

    card.Zone = Zone.Graveyard;
    if (!card.IsToken) state.Grave[teamIndex].push(cardIndex);
}
