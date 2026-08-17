
import type { DestroyCardLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

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
        // a set trap is destroyed out of the trap zone, everything else off the field
        const zoneArr = state.Cards[targetCard].Zone === Zone.Trap ? state.Traps[targetTeam] : state.Field[targetTeam];

        state.Cards[targetCard].Zone = 3;

        for (let i = 0; i < zoneArr.length; i++) {
            if (zoneArr[i] === targetCard) {
                zoneArr.splice(i, 1);
                break;
            }
        }

        // add to grave
        if (!state.Cards[targetCard].IsToken) {
            state.Grave[targetTeam].push(targetCard);
        }
    }

}