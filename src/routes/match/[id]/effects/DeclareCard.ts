
import type { DeclareCardLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

export function declareCard(state: GameState, log: DeclareCardLog) {
    const teamIndex = log.TeamIndex;
    const cardIndex = log.CardIndex;

    // all declared cards go to the stack; units read as Summoning here via getCardStatus
    state.Cards[cardIndex].Zone = Zone.Stack;

    // remove from hand
    const handIdx = state.Hand[teamIndex].indexOf(cardIndex);
    if (handIdx !== -1) state.Hand[teamIndex].splice(handIdx, 1);

    state.Cards[cardIndex].AutoSummon = 0;
}