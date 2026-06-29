
import type { EventLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

import { drawCard } from "./DrawCard";
import { incrementPhase } from "./IncrementPhase";
import { declareCard } from "./DeclareCard";
import { summonUnit } from "./SummonUnit";
import { addStack } from "./ScheduleChain";
import { removeStack } from "./RemoveChain";
import { destroyCard } from "./DestroyCard";
import { gainMana } from "./GainMana";
import { spendMana } from "./SpendMana";
import { attack } from "./Attack";
import { heal } from "./Heal";
import { ready } from "./Ready";
import { unready } from "./Unready";
import { stage } from "./Stage";
import { autoSummon } from "./AutoSummon";
import { pause } from "./Pause";
import { unpause } from "./Unpause";
import { addAbilityTimer } from "./AddAbilityTimer";
import { clearAbilityTimer } from "./ClearAbilityTimer";
import { gameOver } from "./GameOver";
import { counterStack } from "./CounterChain";
import { refreshStack } from "./RefreshStack";
import { playContinuous } from "./PlayContinuous";
import { removeContinuous } from "./RemoveContinuous";
import { removeCharge } from "./RemoveCharge";
import { addCharge } from "./AddCharge";
import { preselect } from "./Preselect";

export function applyEffect(state: GameState, log: EventLog) {

    let applied = true;
    switch(log.Type) {
        case 0:  incrementPhase(state, log); break;
        case 1:  drawCard(state, log); break;
        case 2:  declareCard(state, log); break;
        case 3:  summonUnit(state, log); break;
        case 4:  addStack(state, log); break;
        case 5:  removeStack(state, log); break;
        case 6:  destroyCard(state, log); break;
        case 7:  gainMana(state, log); break;
        case 8:  spendMana(state, log); break;
        case 9:  attack(state, log); break;
        case 10: heal(state, log); break;
        case 11: ready(state, log); break;
        case 12: unready(state, log); break;
        case 13: stage(state, log); break;
        case 14: autoSummon(state, log); break;
        case 15: pause(state, log); break;
        case 16: unpause(state, log); break;
        case 17: addAbilityTimer(state, log); break;
        case 18: clearAbilityTimer(state, log); break;
        case 19: gameOver(state, log); break;
        case 20: counterStack(state, log); break;
        case 21: refreshStack(state, log); break;
        case 22: playContinuous(state, log); break;
        case 23: removeContinuous(state, log); break;
        case 24: removeCharge(state, log); break;
        case 25: addCharge(state, log); break;
        case 26: preselect(state, log); break;

        default: console.log("could not apply log", log); applied = false; break;
    }

    if (applied) {
        state.WallTimestamp = log.WallTimestamp;
        state.UpdateID = log.UpdateID;
    }

}
