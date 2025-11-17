
export interface Timestamp {
    Timestamp: number;   
    GameStateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    Timestamp: number; 
    GameStateID: number;

    // team sets: index (unitID) -> team index
    Team: number[];
    Zone: number[]; // 0: Bench, 1: Field, 2: Deaed

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

        // metadata per unitID
        Team: [],
        Zone: [],
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

        // metadata per unitID
        Team: [...src.Team],
        Zone: [...src.Zone],
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