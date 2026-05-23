
import type { DestroyCardLog } from "../engine/logs";
import { CardStatus, type GameState } from "../engine/gameState"

export function destroyCard(state: GameState, log: DestroyCardLog) {

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
                state.Cards[idx].Status = CardStatus.Default;
                state.Grave[i].push(idx);
            }
            state.Field[i] = [];
        }
    } else {
        state.Cards[targetCard].Zone = 3;
        state.Cards[targetCard].Status = CardStatus.Default;

        // remove from field arr
        const fieldArr = state.Field[targetTeam];
        for (let i = 0; i < fieldArr.length; i++) {
            if (fieldArr[i] === targetCard) {
                fieldArr.splice(i, 1);
                break;
            }
        }

        // add to grave
        state.Grave[targetTeam].push(targetCard);
    }

    // tbh temporary hack to send casting card to grave, many ways to do this, including adding a field to log data structure, or creating a new effect entirely
    if(state.Cards[cardIndex].Zone === 4) { // in TemporaryUnaccessible zone
        state.Cards[cardIndex].Zone = 3; // send to grave
        state.Cards[cardIndex].Status = CardStatus.Default;
        state.Grave[teamIndex].push(cardIndex);
    } else {
        console.log("quick hack in destroy card...");
    }


}