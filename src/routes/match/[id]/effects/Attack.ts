
import type { AttackLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function attack(state: GameState, log: AttackLog) {

    if (log.TargetIsUnit) {
        const fieldArr = state.Field[log.TargetTeamIndex];
        const cardIdx = fieldArr[log.TargetCardIndex];
        state.Cards[cardIdx].HP -= log.Damage;

        if (state.Cards[cardIdx].HP <= 0) {
            state.Cards[cardIdx].Zone = 3;
            fieldArr.splice(log.TargetCardIndex, 1);
            state.Grave[log.TargetTeamIndex].push(cardIdx);
        }
    } else {
        state.Structures[log.TargetTeamIndex].HP -= log.Damage;
    }

    state.UpdateID = log.UpdateID + 1;

}
