
export interface Timestamp {
    Timestamp: number;   
}

export type GameState = Timestamp & { // extends the interface
  
    //
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
