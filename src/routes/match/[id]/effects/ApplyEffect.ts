
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
            console.log("TO IMPLEMENT: declare card", log);    

            break;
        case 3:
            console.log("TO IMPLEMENT: summon unit", log);
            
            break;
        default:
            console.log("could not apply log", log);
            break;
    }
}