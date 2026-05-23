
import type { SummonResolutionLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function summonUnit(state: GameState, log: SummonResolutionLog) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;

    // update card's state
    state.Cards[cardIndex].Zone = 2;
    state.Field[teamIndex].push(cardIndex);

    // apply any effects
    // apply any triggers


}