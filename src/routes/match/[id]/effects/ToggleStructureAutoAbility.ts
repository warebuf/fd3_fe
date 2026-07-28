import type { ToggleStructureAutoAbilityLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function toggleStructureAutoAbility(state: GameState, log: ToggleStructureAutoAbilityLog) {
    const structure = state.Structures[log.TeamIndex];
    if (!structure) return;
    structure.AutoAbility = log.On;
}
