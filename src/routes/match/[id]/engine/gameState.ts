
export interface Timestamp {
    WallTimestamp: number;
    UpdateID: number;
}

export type GameState = {
    UpdateID: number;
    WallTimestamp: number;

    Phase: number;

    PausePhase: number;
    PauseStack: [number, number];
    FullPauseOffset: number;
    SimPauseOffset: number;
    TeamPaused: number;
    TimeBank: number[];

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];

    Chain: ChainItem[];

    Mana: number[];
    Structures: Structure[];
    Ready: boolean[];
};

export const PausePhase = {
    FullPause:   0,
    SimPause:    1,
    Simulating:  2,
} as const;

export const Phase = {
    PreMatch: 0,
    Draw: 1,
    BoardSetup: 2,
    Reveal: 3,
    Play: 4,
    GameEnd: 5,
} as const;

export const Zone = {
    Deck: 0,
    Hand: 1,
    Field: 2,
    Graveyard: 3,
    Chain: 4,
} as const;

export const ChainItemType = {
    Card: 0,
    Ability: 1,
    Spell: 2,
} as const;

export interface Structure {
    DefNo: number;
    HP: number;
}

export const AbilityTimerType = {
    Normal: 0,
    Summon: 1,
} as const;

export interface AbilityTimer {
    AbilityID: number;
    AbilityIdx: number;
    Type: number;
    StartAtSimTime: number;
    ExecuteAtSimTime: number;
}

export interface Card {
    DefNo: number;
    Name: string;
    Description: string;
    Cost: number;
    HP: number;

    Team: number;
    Type: number;
    Zone: number;
    Armed: boolean;
    AutoSummon: number;
    AbilityTimers: AbilityTimer[];
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export interface ChainItem {
    Type: number;
    CardID: number;
    StartAtActiveTime: number;
    PopAtActiveTime: number;
    ExecuteAtActiveTime: number;
    Effects: Effect[];
}


export function initGameState(): GameState {
    return {
        UpdateID: 0,
        WallTimestamp: Date.now(),
        Phase: 0,

        PausePhase: 0,
        PauseStack: [0, 0],
        FullPauseOffset: 0,
        SimPauseOffset: 0,
        TeamPaused: 0,
        TimeBank: [0, 0],

        Cards: [],
        Deck: [[], []],
        Hand: [[], []],
        Field: [[], []],
        Grave: [[], []],

        Chain: [],

        Mana: [],
        Structures: [],
        Ready: [false, false],
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        UpdateID: src.UpdateID,
        WallTimestamp: src.WallTimestamp,
        Phase: src.Phase,

        PausePhase: src.PausePhase,
        PauseStack: [...src.PauseStack] as [number, number],
        FullPauseOffset: src.FullPauseOffset,
        SimPauseOffset: src.SimPauseOffset,
        TeamPaused: src.TeamPaused,
        TimeBank: [...src.TimeBank],

        Cards: src.Cards.map(card => ({ ...card, AbilityTimers: card.AbilityTimers.map(t => ({ ...t })) })),
        Deck: src.Deck.map(d => [...d]),
        Hand: src.Hand.map(h => [...h]),
        Field: src.Field.map(f => [...f]),
        Grave: src.Grave.map(g => [...g]),

        Chain: src.Chain.map(item => ({ ...item, Effects: [...item.Effects] })),

        Mana: [...src.Mana],
        Structures: src.Structures.map(s => ({ ...s })),
        Ready: [...src.Ready],
    };
}
