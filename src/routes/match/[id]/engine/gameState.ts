
export interface Timestamp {
    Timestamp: number;   
    GameStateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    GameStateID: number;
    Timestamp: number; 

    // team sets: index (unitID) -> team index
    Team: number[];
    Zone: number[]; // 0: Bench, 1: Field, 2: Deaed

    // model set
    ModelNo: number[];

    // core unit stats
    HP: number[];

    // abilities
	Abilities:       number[]; // abilities are flattened for each unit
	AbilityStartIdx: number[]; // the starting index in Abilities[] for this unit
	AbilityCount:    number[]; // how many abilities belong to each unit
	AbilityCharge:   number[];
	AbilitySPD:      number[];

    // counter
    NextUnitID: number;

    randomID: number; // used for identifying memory address
};

export function initGameState() : GameState {
    return {
        // timestamp fields
        Timestamp: Date.now(),
        GameStateID: 0,

        // metadata per unitID
        Team: [],
        Zone: [],
        ModelNo: [],
        HP: [],
        Abilities: [],
        AbilityStartIdx: [],
        AbilityCount: [],
        AbilityCharge: [],
        AbilitySPD: [],

        // id counter
        NextUnitID: 0,

        randomID: Math.random(),
    };
}

export function cloneGameState(src: GameState) : GameState {
    return {
        // timestamp fields
        Timestamp: src.Timestamp,
        GameStateID: src.GameStateID,

        // metadata per unitID
        Team: [...src.Team],
        Zone: [...src.Zone],
        ModelNo: [...src.ModelNo],
        HP: [...src.HP],

        // ability
        Abilities: [...src.Abilities],
        AbilityStartIdx: [...src.AbilityStartIdx],
        AbilityCount: [...src.AbilityCount],
        AbilityCharge: [...src.AbilityCharge],
        AbilitySPD: [...src.AbilitySPD],

        // id counter
        NextUnitID: src.NextUnitID,
        
        randomID: Math.random(),
    };
}