import type { ToggleAutoAbilityLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function toggleAutoAbility(state: GameState, log: ToggleAutoAbilityLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;
    card.Actives[log.AbilityIndex].AutoAbility = log.On;
}
