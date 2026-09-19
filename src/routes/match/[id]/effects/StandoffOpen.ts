import type { StandoffOpenLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function standoffOpen(state: GameState, log: StandoffOpenLog) {
    const cardIndex = log.CardIndex;
    const teamIndex = log.TeamIndex;
    const card = state.Cards[cardIndex];
    if (!card) return;

    const trapIdx = state.Traps[teamIndex].indexOf(cardIndex);
    if (trapIdx !== -1) state.Traps[teamIndex].splice(trapIdx, 1);

    card.Zone = Zone.Pending;
    card.Ready = false;

    state.StandoffCardIndex = cardIndex;
    state.PendingBidAmount = [-1, -1];
}
