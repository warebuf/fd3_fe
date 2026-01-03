
export interface Timestamp {
    Timestamp: number;   
    GameStateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    GameStateID: number;
    Timestamp: number; 
    Round: number;

    // team sets: index (unitID) -> team index
    Team: number[];
    Zone: number[]; // 0: Bench, 1: Field, 2: Dead, 3: queuedSummon

    // model set
    ModelNo: number[];

    // core unit stats
    HP: number[];
    EXP: number[];

    // functions
	Functions:       number[]; // functions are flattened for each unit
	FunctionType: number[];
    FunctionStartIdx: number[]; // the starting index in Functions[] for this unit
	FunctionCount:    number[]; // how many functions belong to each unit
	FunctionCharge:   number[];
	FunctionSPD:      number[];
    FunctionTarget: number[];

};

export function initGameState() : GameState {
    return {
        // timestamp fields
        Timestamp: Date.now(),
        GameStateID: 0,
        Round: 0,

        // metadata per unitID
        Team: [],
        Zone: [],
        ModelNo: [],
        HP: [],
        EXP: [],
        Functions: [],
        FunctionType: [],
        FunctionStartIdx: [],
        FunctionCount: [],
        FunctionCharge: [],
        FunctionSPD: [],
        FunctionTarget: [],
    };
}

export function cloneGameState(src: GameState) : GameState {
    return {
        // timestamp fields
        Timestamp: src.Timestamp,
        GameStateID: src.GameStateID,
        Round: src.Round,

        // metadata per unitID
        Team: [...src.Team],
        Zone: [...src.Zone],
        ModelNo: [...src.ModelNo],
        HP: [...src.HP],
        EXP: [...src.EXP],

        // functions
        Functions: [...src.Functions],
        FunctionType: [...src.FunctionType],
        FunctionStartIdx: [...src.FunctionStartIdx],
        FunctionCount: [...src.FunctionCount],
        FunctionCharge: [...src.FunctionCharge],
        FunctionSPD: [...src.FunctionSPD],
        FunctionTarget: [...src.FunctionTarget],
    };
}