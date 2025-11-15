
export interface Timestamp {
    Timestamp: number;   
}

export type GameState = Timestamp & {
  
    // extends the interface
    Timestamp: number; // just reminding myself, harmless but redundant
    
    //
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
    };
}