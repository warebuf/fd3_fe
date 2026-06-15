
import type { DeclareCardLog } from "../engine/logs";
import { Zone, CardStatus, type GameState } from "../engine/gameState"

export function declareCard(state: GameState, log: DeclareCardLog) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;

    // check card type
    let cardType = state.Cards[cardIndex].Type;
    if (cardType == 1) { // unit type

        // update card's state
        state.Cards[cardIndex].Zone = Zone.Field;
        state.Cards[cardIndex].Status = CardStatus.Summoning;

        // remove card from hand, add to field
        for(let i = 0; i < state.Hand[teamIndex].length; i++) {
            if(cardIndex == state.Hand[teamIndex][i]) {
                state.Hand[teamIndex].splice(i, 1);
            }
        }
        state.Field[teamIndex].push(cardIndex);
        
    } else if (cardType == 3 || cardType == 4) { // spell or continuous type

        // update card's state
        state.Cards[cardIndex].Zone = 4;
        
        // remove card from hand
        for(let i = 0; i < state.Hand[teamIndex].length; i++) {
            if(cardIndex == state.Hand[teamIndex][i]) {
                state.Hand[teamIndex].splice(i, 1);
            }
        }

    }

    // set autosummon to 0
    state.Cards[cardIndex].AutoSummon = 0;


}