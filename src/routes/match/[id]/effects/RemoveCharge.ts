import type { RemoveChargeLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function removeCharge(state: GameState, log: RemoveChargeLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;
    card.Charges = log.ChargesRemaining;
}
