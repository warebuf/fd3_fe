import type { AddChargeLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function addCharge(state: GameState, log: AddChargeLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;
    card.Charges = log.Charges;
}
