
import type { EventLog } from "../engine/stateManager";
import type { GameState } from "../engine/gameState"

// A: team index, B: card index
export function declareCard(state: GameState, log: EventLog ) {

    let teamIndex = log.A;
    let cardIndex = log.B;

    // update card to pending state
    state.Cards[cardIndex].Zone = 4;

    // remove card from hand
    
    
    // send card to grave
    // add permanent loading UI

    


    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}