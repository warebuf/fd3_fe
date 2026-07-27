
import type { DestroyCardLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function destroyCard(state: GameState, log: DestroyCardLog) {

    let targetAll = log.TargetAll;
    let targetTeam = log.TargetTeamIndex;
    let targetCard = log.TargetCardIndex;

    if(targetAll) {
        for(let i = 0; i < state.Field.length; i++) {
            for(let j = 0; j < state.Field[i].length; j++) {
                const idx = state.Field[i][j];
                state.Cards[idx].Zone = 3;
                if (!state.Cards[idx].IsToken) {
                    state.Grave[i].push(idx);
                }
            }
            state.Field[i] = [];
        }
    } else {
        state.Cards[targetCard].Zone = 3;

        // remove from field arr
        const fieldArr = state.Field[targetTeam];
        for (let i = 0; i < fieldArr.length; i++) {
            if (fieldArr[i] === targetCard) {
                fieldArr.splice(i, 1);
                break;
            }
        }

        // add to grave
        if (!state.Cards[targetCard].IsToken) {
            state.Grave[targetTeam].push(targetCard);
        }
    }

}