
import type { SummonUnitEntry } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function summonUnit(state: GameState, log: SummonUnitEntry) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;

    // update card's state
    state.Cards[cardIndex].Zone = 2;
    state.Field[teamIndex].push(cardIndex);

    // apply any effects
    // apply any triggers

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}