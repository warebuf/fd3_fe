
export interface Timestamp {
    Timestamp: number;   
    UpdateID: number;
}

export type GameState = Timestamp & {

    // extends the interface, just reminding myself, harmless but redundant
    UpdateID: number;
    Timestamp: number;

    Phase: number;

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];

    ReactionPQ: PriorityQueue;

    Mana: number[];
    Structures: Structure[];
    StagedCards: number[][];
    Ready: boolean[];

};

export const Phase = {
    PreMatch: 0,
    Draw: 1,
    BoardSetup: 2,
    Reveal: 3,
    Play: 4,
    GameEnd: 5,
} as const;

export interface Structure {
    DefNo: number;
    HP: number;
}

export interface Card {
    //
    DefNo: number;
    Name: string;
    Description: string;
    Cost: number;
    HP: number;

    //
    CardID: number;
    Team: number;
    Type: number;
    Zone: number; // 0: deck, 1: hand, 2: field, 3: grave, 4: TemporaryUnaccessible
    Armed: boolean;
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export const ChainStepType = {
    Card: 0,
    CardEffect: 1,
    Ability: 2,
    Other: 3,
    Summon: 4,
    Spell: 5,
    Recurring: 6,
} as const;

export type ChainStepTypeValue = typeof ChainStepType[keyof typeof ChainStepType];

export interface ChainStep {
    Type: ChainStepTypeValue;
    CardID: number;
    StartTime: number;
    OccurTime: number;
    PopTime: number;
    Effects: Effect[];
    Persistent: boolean;
}

export interface Chain {
    ChainID: number;
    PopTime: number;
    ChainSteps: ChainStep[];
}

export interface PriorityQueue {
    Items: Chain[];
}

export function initGameState(): GameState {
    return {
        Timestamp: Date.now(),
        UpdateID: 0,
        Phase: 0,

        Cards: [],
        Deck: [[],[]],
        Hand: [[],[]],
        Field: [[],[]],
        Grave: [[],[]],

        ReactionPQ: { Items: [] },

        Mana: [],
        Structures: [],
        StagedCards: [[], []],
        Ready: [false, false],
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        Timestamp: src.Timestamp,
        UpdateID: src.UpdateID,
        Phase: src.Phase,

        Cards: src.Cards.map(card => ({ ...card })),

        Deck: src.Deck.map(teamDeck => [...teamDeck]),
        Hand: src.Hand.map(teamHand => [...teamHand]),
        Field: src.Field.map(teamField => [...teamField]),
        Grave: src.Grave.map(teamGrave => [...teamGrave]),

        ReactionPQ: {
            Items: src.ReactionPQ.Items.map(chain => ({
                ...chain,
                ChainSteps: chain.ChainSteps.map(entry => ({
                    ...entry,
                    Effects: [...entry.Effects],
                })),
            })),
        },

        Mana: [...src.Mana],
        Structures: src.Structures.map(s => ({ ...s })),
        StagedCards: src.StagedCards.map(team => [...team]),
        Ready: [...src.Ready],
    };
}