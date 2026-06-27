
import type { DeclareCardLog } from "../engine/logs";
import { Zone, CardStatus, CardType, type GameState } from "../engine/gameState"

export function declareCard(state: GameState, log: DeclareCardLog) {
    const teamIndex = log.TeamIndex;
    const cardIndex = log.CardIndex;

    // all declared cards go to the stack
    state.Cards[cardIndex].Zone = Zone.Stack;

    // units are summoning until the stack resolves
    if (state.Cards[cardIndex].Type === CardType.Unit) {
        state.Cards[cardIndex].Status = CardStatus.Summoning;
    }

    // remove from hand
    const handIdx = state.Hand[teamIndex].indexOf(cardIndex);
    if (handIdx !== -1) state.Hand[teamIndex].splice(handIdx, 1);

    state.Cards[cardIndex].AutoSummon = 0;
}