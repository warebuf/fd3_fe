
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
        case 2:
            state.Cards[log.B].Zone = 4;
            // remove card from hand
            // send card to grave
            break;
        case 3:
            // create the permanent
            console.log("TO IMPLEMENT: summon unit", log);
            break;
        default:
            console.log("could not apply log", log);
            break;
    }
}