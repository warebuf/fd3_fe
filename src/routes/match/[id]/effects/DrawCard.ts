
import type { EventLog } from "../engine/stateManager";
import type { GameState } from "../engine/gameState"

// A: team index, B: num of cards
export function drawCard(state: GameState, log: EventLog ) {

    console.log("called drawCard")

    let teamIndex = log.A;
    let numCards = log.B;

    for( let i = 0; i < numCards; i++ ) {
        if( state.Deck[teamIndex].length <= 0 ) { return; } // TODO: if deck is empty

        let cardIndex = state.Deck[teamIndex][0]
        state.Deck[teamIndex] = state.Deck[teamIndex].slice(1); // draw top card
        state.Hand[teamIndex].push(cardIndex); // move to hand
        state.Cards[cardIndex].Zone = 1; // update card state to Hand
    }

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}