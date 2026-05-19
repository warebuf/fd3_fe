
import type { EventLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

import { drawCard } from "./DrawCard";
import { incrementPhase } from "./IncrementPhase";
import { declareCard } from "./DeclareCard";
import { summonUnit } from "./SummonUnit";
import { addSimItem } from "./AddSimItem";
import { removeSimItem } from "./RemoveSimItem";
import { addChain } from "./ScheduleChain";
import { removeChain } from "./RemoveChain";
import { destroyCard } from "./DestroyCard";
import { gainMana } from "./GainMana";
import { spendMana } from "./SpendMana";
import { attack } from "./Attack";
import { ready } from "./Ready";
import { autoSummon } from "./AutoSummon";
import { pause } from "./Pause";
import { unpause } from "./Unpause";

export function applyEffect(state: GameState, log: EventLog) {

    switch(log.Type) {
        case 0:  incrementPhase(state, log); break;
        case 1:  drawCard(state, log); break;
        case 2:  declareCard(state, log); break;
        case 3:  summonUnit(state, log); break;
        case 4:  addSimItem(state, log); break;
        case 5:  removeSimItem(state, log); break;
        case 6:  addChain(state, log); break;
        case 7:  removeChain(state, log); break;
        case 8:  destroyCard(state, log); break;
        case 9:  gainMana(state, log); break;
        case 10: spendMana(state, log); break;
        case 11: attack(state, log); break;
        case 12: ready(state, log); break;
        case 13: autoSummon(state, log); break;
        case 14: pause(state, log); break;
        case 15: unpause(state, log); break;

        default: console.log("could not apply log", log); break;
    }

}
