
export interface Timestamp {
    Timestamp: number;   
    GameStateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    Timestamp: number; 
    GameStateID: number;
  
    // state sets: array of unitIDs
    BenchUnits: number[];
    FieldUnits: number[];
    DeadUnits: number[];

    // team sets: index (unitID) -> team index
    Team: number[];

    // model set
    ModelNo: number[];

    // core unit stats
    HP: number[];

    // telemetry (index by unitID)
    TimesAttacked: number[];
    TimesDefended: number[];
    DamageDealt: number[];
    DamageReceived: number[];

    // counter
    NextUnitID: number;

    randomID: number; // used for identifying memory address
};

export function initGameState() : GameState {
    return {
        // timestamp fields
        Timestamp: Date.now(),
        GameStateID: 0,

        // unit sets
        BenchUnits: [],
        FieldUnits: [],
        DeadUnits: [],

        // metadata per unitID
        Team: [],
        ModelNo: [],
        HP: [],

        // telemetry
        TimesAttacked: [],
        TimesDefended: [],
        DamageDealt: [],
        DamageReceived: [],

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

        // unit sets
        BenchUnits: [...src.BenchUnits],
        FieldUnits: [...src.FieldUnits],
        DeadUnits: [...src.DeadUnits],

        // metadata per unitID
        Team: [...src.Team],
        ModelNo: [...src.ModelNo],
        HP: [...src.HP],

        // telemetry
        TimesAttacked: [...src.TimesAttacked],
        TimesDefended: [...src.TimesDefended],
        DamageDealt: [...src.DamageDealt],
        DamageReceived: [...src.DamageReceived],

        // id counter
        NextUnitID: src.NextUnitID,
        
        randomID: Math.random(),
    };
}