import type { TrapReadyLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function trapReady(state: GameState, log: TrapReadyLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;

    card.Ready = true;
}
