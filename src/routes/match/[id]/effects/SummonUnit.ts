
import type { SummonResolutionLog } from "../engine/logs";
import { Zone, CardStatus, type GameState } from "../engine/gameState"

export function summonUnit(state: GameState, log: SummonResolutionLog) {
    const cardIndex = log.CardIndex;
    const teamIndex = log.TeamIndex;

    state.Cards[cardIndex].Zone = Zone.Field;
    state.Cards[cardIndex].Status = CardStatus.UnitActive;
    state.Field[teamIndex].push(cardIndex);
}