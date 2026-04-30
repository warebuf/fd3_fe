
import type { DestroyCardEntry } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function destroyCard(state: GameState, log: DestroyCardEntry) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;
    let targetAll = log.TargetAll;
    let targetTeam = log.TargetTeamIndex;
    let targetCard = log.TargetCardIndex;

    if(targetAll) {
        for(let i = 0; i < state.Field.length; i++) {
            for(let j = 0; j < state.Field[i].length; j++) {
                const idx = state.Field[i][j];
                state.Cards[idx].Zone = 3;
                state.Grave[i].push(idx);
            }
            state.Field[i] = [];
        }
    } else {
        console.log("have not coded destroy card specific");
    }

    // tbh temporary hack to send casting card to grave, many ways to do this, including adding a field to log data structure, or creating a new effect entirely
    if(state.Cards[cardIndex].Zone === 4) { // in TemporaryUnaccessible zone
        state.Cards[cardIndex].Zone = 3; // send to grave
        state.Grave[teamIndex].push(cardIndex);
    } else {
        console.log("quick hack in destroy card...");
    }

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}