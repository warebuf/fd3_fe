
export interface Timestamp {
    WallTimestamp: number;
    UpdateID: number;
}

export type GameState = {
    UpdateID: number;
    WallTimestamp: number;

    Phase: number;
    PhaseEndInActiveTime: number; // 0 if no fixed end

    PausePhase: number;
    FullPauseStartedAt: number;
    SimPauseStartedAt: number;
    FullPauseOffset: number;
    SimPauseOffset: number;
    TeamPaused: number;
    TimeBank: number[];

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];
    Continuous: number[][];

    Stack: StackItem[];

    Mana: number[];
    Structures: Structure[];
    Ready: boolean[];

    Winner: number; // -1: no winner, 0+: winning team index
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
    Stack: 4,
    Continuous: 5,
} as const;

export const StackItemType = {
    Card: 0,
    Ability: 1,
    Spell: 2,
    ContinuousActivation: 3,
    Summon: 4,
} as const;

export const CardType = {
    Structure: 0,
    Unit: 1,
    Trap: 2,
    Spell: 3,
    Continuous: 4,
} as const;

export const EffectType = {
    Attack:      1,
    Heal:        2,
    Draw:        3,
    Mana:        4,
    Silence:     5,
    GrantAbility: 6,
    Destroy:     7,
    Counter:     8,
    GainCharge:  9,
} as const;

export interface Structure {
    DefNo: number;
    HP: number;
}

export const AbilityTimerType = {
    Normal: 0,
} as const;

export interface AbilityTimer {
    AbilityID: number;
    AbilityIdx: number;
    Type: number;
    StartAtSimTime: number;
    ExecuteAtSimTime: number;
}

export const Archetype = {
    None: 0,
    Tree: 1,
} as const;

export const CardStatus = {
    Default:           0, // spells, structures, continuous
    Summoning:         1, // unit: on field, summon window not yet resolved
    UnitActive:        2, // unit: fully resolved and active
    Set:               3, // trap: face-down on field
    TrapActive:        4, // trap: triggered/active
    ContinuousActive:  5, // continuous spell: in continuous zone
} as const;

export interface Card {
    DefNo: number;
    Name: string;
    Description: string;
    Cost: number;
    HP: number;
    Archetype: number;
    Taunt: boolean;

    Team: number;
    Type: number;
    Zone: number;
    Status: number;
    StageOrder: number;
    AutoSummon: number;
    AbilityTimers: AbilityTimer[];
    Charges: number;
    MaxCharges: number;
    Targets: [number];
    AuraModifiers: AuraModifier[];
}

export interface AuraModifier {
    SourceCardID: number;
    Stat: number;
    Amount: number;
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export interface StackItem {
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
        PhaseEndInActiveTime: 0,

        PausePhase: 2,
        FullPauseStartedAt: 0,
        SimPauseStartedAt: 0,
        FullPauseOffset: 0,
        SimPauseOffset: 0,
        TeamPaused: -1,
        TimeBank: [0, 0],

        Cards: [],
        Deck: [[], []],
        Hand: [[], []],
        Field: [[], []],
        Grave: [[], []],
        Continuous: [[], []],

        Stack: [],

        Mana: [],
        Structures: [],
        Ready: [false, false],

        Winner: -1,
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        UpdateID: src.UpdateID,
        WallTimestamp: src.WallTimestamp,
        Phase: src.Phase,
        PhaseEndInActiveTime: src.PhaseEndInActiveTime,

        PausePhase: src.PausePhase,
        FullPauseStartedAt: src.FullPauseStartedAt,
        SimPauseStartedAt: src.SimPauseStartedAt,
        FullPauseOffset: src.FullPauseOffset,
        SimPauseOffset: src.SimPauseOffset,
        TeamPaused: src.TeamPaused,
        TimeBank: [...src.TimeBank],

        Cards: src.Cards.map(card => ({ ...card, AbilityTimers: card.AbilityTimers?.map(t => ({ ...t })) ?? [], AuraModifiers: card.AuraModifiers?.map(m => ({ ...m })) ?? [], Targets: [...card.Targets] as [number] })),
        Deck: src.Deck.map(d => [...d]),
        Hand: src.Hand.map(h => [...h]),
        Field: src.Field.map(f => [...f]),
        Grave: src.Grave.map(g => [...g]),
        Continuous: src.Continuous.map(c => [...c]),

        Stack: src.Stack.map(item => ({ ...item, Effects: [...item.Effects] })),

        Mana: [...src.Mana],
        Structures: src.Structures.map(s => ({ ...s })),
        Ready: [...src.Ready],

        Winner: src.Winner,
    };
}
