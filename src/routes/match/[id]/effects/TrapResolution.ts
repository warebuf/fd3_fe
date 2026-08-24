
import type { TrapResolutionLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

export function trapResolution(state: GameState, log: TrapResolutionLog) {
    const cardIndex = log.CardIndex;
    const teamIndex = log.TeamIndex;
    const card = state.Cards[cardIndex];
    if (!card) return;

    const trapIdx = state.Traps[teamIndex].indexOf(cardIndex);
    if (trapIdx !== -1) state.Traps[teamIndex].splice(trapIdx, 1);

    card.Zone = Zone.Graveyard;
    state.Grave[teamIndex].push(cardIndex);
}
