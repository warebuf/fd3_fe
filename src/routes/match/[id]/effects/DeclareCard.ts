
import type { EventLog } from "../engine/stateManager";
import type { GameState } from "../engine/gameState"

// A: team index, B: card index
export function declareCard(state: GameState, log: EventLog ) {

    let teamIndex = log.A;
    let cardIndex = log.B;

    // check card type
    let cardType = state.Cards[cardIndex].Type;
    if (cardType == 1) { // unit type        

        // update card's state
        state.Cards[cardIndex].Zone = 2;
        state.Cards[cardIndex].Pending = true;

        // remove card from hand
        for(let i = 0; i < state.Hand[teamIndex].length; i++) {
            if(cardIndex == state.Hand[teamIndex][i]) {
                state.Hand[teamIndex].splice(i, 1);
            }
        }
        
        // send card to field
        state.Field[teamIndex].push(cardIndex);

    } else if (cardType == 3) { // spell type

        // update card's state
        state.Cards[cardIndex].Zone = 4;
        
        // remove card from hand
        for(let i = 0; i < state.Hand[teamIndex].length; i++) {
            if(cardIndex == state.Hand[teamIndex][i]) {
                state.Hand[teamIndex].splice(i, 1);
            }
        }

        // add effect to the stack area

    }

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}