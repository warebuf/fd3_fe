
import type { EquipResolutionLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

export function equipResolution(state: GameState, log: EquipResolutionLog) {
    const cardIndex = log.CardIndex;
    const teamIndex = log.TeamIndex;

    state.Cards[cardIndex].Zone = Zone.Equip;
    state.Cards[cardIndex].EquipHostIndex = log.HostIndex;
    state.Equip[teamIndex].push(cardIndex);
}
