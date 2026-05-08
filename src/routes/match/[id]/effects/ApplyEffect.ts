
import type { EventLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

import { drawCard } from "./DrawCard";
import { incrementPhase } from "./IncrementPhase";
import { declareCard } from "./DeclareCard";
import { summonUnit } from "./SummonUnit";
import { scheduleChain } from "./ScheduleChain";
import { removeChain } from "./RemoveChain";
import { destroyCard } from "./DestroyCard";
import { gainMana } from "./GainMana";
import { spendMana } from "./SpendMana";
import { attack } from "./Attack";
import { ready } from "./Ready";

export function applyEffect(state: GameState, log: EventLog) {

    switch(log.Type) {
        case 0: incrementPhase(state, log); break;
        case 1: drawCard(state, log); break;
        case 2: declareCard(state, log); break;
        case 3: summonUnit(state, log); break;
        case 4: scheduleChain(state, log); break;
        case 5: removeChain(state, log); break;
        case 6: destroyCard(state, log); break;
        case 7: gainMana(state, log); break;
        case 8: spendMana(state, log); break;
        case 9: attack(state, log); break;
        case 10: ready(state, log); break;

        default: console.log("could not apply log", log); break;
    }

}