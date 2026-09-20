
import type { EventLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

import { drawCard } from "./DrawCard";
import { incrementPhase } from "./IncrementPhase";
import { declareCard } from "./DeclareCard";
import { summonUnit } from "./SummonUnit";
import { addChain } from "./ScheduleChain";
import { removeChain } from "./RemoveChain";
import { destroyCard } from "./DestroyCard";
import { gainMana } from "./GainMana";
import { spendMana } from "./SpendMana";
import { attack } from "./Attack";
import { heal } from "./Heal";
import { ready } from "./Ready";
import { unready } from "./Unready";
import { autoSummon } from "./AutoSummon";
import { pause } from "./Pause";
import { unpause } from "./Unpause";
import { addTickAbility } from "./AddTickAbility";
import { clearTickAbility } from "./ClearTickAbility";
import { gameOver } from "./GameOver";
import { counterChain } from "./CounterChain";
import { refreshChain } from "./RefreshChain";
import { removeCharge } from "./RemoveCharge";
import { addCharge } from "./AddCharge";
import { preselect } from "./Preselect";
import { toggleAutoAbility } from "./ToggleAutoAbility";
import { consume } from "./Consume";
import { spawnToken } from "./SpawnToken";
import { toggleStructureAutoAbility } from "./ToggleStructureAutoAbility";
import { setTrap } from "./SetTrap";
import { trapReady } from "./TrapReady";
import { purgeChain } from "./PurgeChain";
import { equipResolution } from "./EquipResolution";
import { trapResolution } from "./TrapResolution";
import { skipChain } from "./SkipChain";
import { unskipChain } from "./UnskipChain";
import { giveControl } from "./GiveControl";
import { standoffOpen } from "./StandoffOpen";
import { standoffBid } from "./StandoffBid";
import { standoffResolution } from "./StandoffResolution";
import { discard } from "./Discard";

export function applyEffect(state: GameState, log: EventLog) {

    let applied = true;
    switch(log.Type) {
        case 0:  incrementPhase(state, log); break;
        case 1:  drawCard(state, log); break;
        case 2:  declareCard(state, log); break;
        case 3:  summonUnit(state, log); break;
        case 4:  addChain(state, log); break;
        case 5:  removeChain(state, log); break;
        case 6:  destroyCard(state, log); break;
        case 7:  gainMana(state, log); break;
        case 8:  spendMana(state, log); break;
        case 9:  attack(state, log); break;
        case 10: heal(state, log); break;
        case 11: ready(state, log); break;
        case 12: unready(state, log); break;
        case 13: autoSummon(state, log); break;
        case 14: pause(state, log); break;
        case 15: unpause(state, log); break;
        case 16: addTickAbility(state, log); break;
        case 17: clearTickAbility(state, log); break;
        case 18: gameOver(state, log); break;
        case 19: counterChain(state, log); break;
        case 20: refreshChain(state, log); break;
        case 21: removeCharge(state, log); break;
        case 22: addCharge(state, log); break;
        case 23: preselect(state, log); break;
        case 24: toggleAutoAbility(state, log); break;
        case 25: consume(state, log); break;
        case 26: spawnToken(state, log); break;
        case 27: toggleStructureAutoAbility(state, log); break;
        case 28: setTrap(state, log); break;
        case 29: trapReady(state, log); break;
        case 30: purgeChain(state, log); break;
        case 31: equipResolution(state, log); break;
        case 32: trapResolution(state, log); break;
        case 33: skipChain(state, log); break;
        case 34: unskipChain(state, log); break;
        case 35: giveControl(state, log); break;
        case 36: standoffOpen(state, log); break;
        case 37: standoffBid(state, log); break;
        case 38: standoffResolution(state, log); break;
        case 39: discard(state, log); break;

        default: console.log("could not apply log", log); applied = false; break;
    }

    if (applied) {
        state.WallTimestamp = log.WallTimestamp;
        state.UpdateID = log.UpdateID;
    }

}
