import type { GameState } from "../engine/gameState";
import type { AddSimItemLog } from "../engine/logs";

export function addSimItem(state: GameState, log: AddSimItemLog) {
    state.SimulationPQ.Items.push({
        SeqID: log.SeqID,
        StartAtSimTime: log.StartTime,
        PopAtSimTime: 0,
        ExecuteAtSimTime: log.OccurTime,
        CardID: log.CardID,
        Type: log.SimItemType,
        Effects: [],
    });
}
