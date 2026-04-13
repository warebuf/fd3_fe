
import type { EventLog } from "../engine/stateManager";
import type { GameState } from "../engine/gameState"

import { drawCard } from "./DrawCard";
import { incrementPhase } from "./IncrementPhase";

export function applyEffect(state: GameState, log: EventLog) {
    switch(log.Type) {
        case 0:
            incrementPhase(state, log);
            break;
        case 1:
            drawCard(state, log);
            break;
        default:
            break;
    }
}