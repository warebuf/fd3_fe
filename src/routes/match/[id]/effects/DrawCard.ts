
import type { DrawExecEntry } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function drawCard(state: GameState, log: DrawExecEntry) {

    let teamIndex = log.TeamIndex;
    let numCards = log.NumCards;

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