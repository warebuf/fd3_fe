
import type { DeclareCardLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function declareCard(state: GameState, log: DeclareCardLog) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;

    // check card type
    let cardType = state.Cards[cardIndex].Type;
    if (cardType == 1) { // unit type        

        // update card's state
        state.Cards[cardIndex].Zone = 4;
        
        // remove card from hand
        for(let i = 0; i < state.Hand[teamIndex].length; i++) {
            if(cardIndex == state.Hand[teamIndex][i]) {
                state.Hand[teamIndex].splice(i, 1);
            }
        }
        
    } else if (cardType == 3) { // spell type

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

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}