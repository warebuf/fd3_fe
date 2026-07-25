import type { PreselectLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function preselect(state: GameState, log: PreselectLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;
    if (card.Zone === Zone.Hand) {
        card.OnPlay[log.AbilityIndex].Target = log.TargetCardIndex;
    } else {
        card.Actives[log.AbilityIndex].Target = log.TargetCardIndex;
    }
}
