
import type { GameState } from "../../match/[id]/engine/gameState"


export function addFromToolbox( state: GameState, modelData: any, modelNo: number, teamIdx: number, Zone: number ): void {

    state.ModelNo.push(modelNo);
    state.Team.push(teamIdx);
    state.Zone.push(Zone);
    state.HP.push(modelData[modelNo].HP);

    // ability stuff
    state.AbilityStartIdx.push(state.Abilities.length);
    for(let i = 0; i < modelData[modelNo].Abilities.length; i++) {
        state.Abilities.push(modelData[modelNo].Abilities[i].AbilityID);
        state.AbilitySPD.push(modelData[modelNo].Abilities[i].CD * 1000);
        state.AbilityCharge.push(0);
    }
    state.AbilityCount.push(modelData[modelNo].Abilities.length);

}

