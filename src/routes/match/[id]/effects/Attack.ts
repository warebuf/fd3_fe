
import type { AttackLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function attack(state: GameState, log: AttackLog) {

    if (log.TargetCardIndex !== -1) {
        const cardIdx = log.TargetCardIndex;
        state.Cards[cardIdx].HP -= log.Damage;
    } else {
        const structure = state.Structures[log.TargetTeamIndex]?.[log.TargetStructureIndex];
        if (!structure) return;
        structure.HP -= log.Damage;
    }


}
