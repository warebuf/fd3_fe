
import type { GameState } from "../../match/[id]/engine/gameState"


export function addFromToolbox( state: GameState, modelData: any, modelNo: number, teamIdx: number, Zone: number ): void {

    state.ModelNo.push(modelNo);
    state.Team.push(teamIdx);
    state.Zone.push(Zone);
    state.HP.push(modelData[modelNo].HP);
    state.EXP.push(0);

    // function stuff
    state.FunctionStartIdx.push(state.Functions.length);
    for(let i = 0; i < modelData[modelNo].Functions.length; i++) {
        state.Functions.push(modelData[modelNo].Functions[i].FunctionID);
        state.FunctionSPD.push(modelData[modelNo].Functions[i].CD * 1000);
        state.FunctionCharge.push(0);

        switch (modelData[modelNo].Functions[i].Type) {
        case "Auto":
            state.FunctionType.push(0);
            break;
        case "Manual":
            state.FunctionType.push(1);
            break;
        }

    }
    state.FunctionCount.push(modelData[modelNo].Functions.length);

}

