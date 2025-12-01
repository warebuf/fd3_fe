
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
        Abilities: [],
        AbilityStartIdx: [],
        AbilityCount: [],
        AbilityCharge: [],
        AbilitySPD: [],

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

        // ability
        Abilities: [...src.Abilities],
        AbilityStartIdx: [...src.AbilityStartIdx],
        AbilityCount: [...src.AbilityCount],
        AbilityCharge: [...src.AbilityCharge],
        AbilitySPD: [...src.AbilitySPD],
        
    };
}