
import type { AttackLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function attack(state: GameState, log: AttackLog) {

    if (log.TargetCardIndex !== -1) {
        const cardIdx = log.TargetCardIndex;
        state.Cards[cardIdx].HP -= log.Damage;
    } else {
        state.Structures[log.TargetTeamIndex].HP -= log.Damage;
    }


}
