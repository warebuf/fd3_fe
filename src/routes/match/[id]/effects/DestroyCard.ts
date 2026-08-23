
import type { DestroyCardLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

export function destroyCard(state: GameState, log: DestroyCardLog) {

    let targetAll = log.TargetAll;
    let targetTeam = log.TargetTeamIndex;
    let targetCard = log.TargetCardIndex;

    if(targetAll) {
        // every card actually destroyed already arrived as its own individual DestroyCardLog
        return;
    }

    let zoneArr: number[];
    if (state.Cards[targetCard].Zone === Zone.Trap) {
        zoneArr = state.Traps[targetTeam];
    } else if (state.Cards[targetCard].Zone === Zone.Equip) {
        zoneArr = state.Equip[targetTeam];
    } else {
        zoneArr = state.Field[targetTeam];
    }

    state.Cards[targetCard].Zone = Zone.Graveyard;

    for (let i = 0; i < zoneArr.length; i++) {
        if (zoneArr[i] === targetCard) {
            zoneArr.splice(i, 1);
            break;
        }
    }

    if (!state.Cards[targetCard].IsToken) {
        state.Grave[targetTeam].push(targetCard);
    }

}