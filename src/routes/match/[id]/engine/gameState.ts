
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

};

export interface Card {
    //
    DefNo: number;
    Name: string;
    Description: string;

    //
    CardID: number;
    Team: number;
    Type: number;
    Zone: number; // 0: deck, 1: hand, 2: field, 3: grave
    Pending: boolean;
    Armed: boolean;
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export interface StackEntry {
    Type: number;    // 0: card, 1: card eff, 2: ability, 3: other, 4: summon
    CardID: number;
    PopTime: number;
    Effects: Effect[];

    // maybe StackEntry should carry it's EffectIndex
}

export interface Stack {
    StackID: number;
    PopTime: number;
    StackEntries: StackEntry[];
}

export interface PriorityQueue {
    Items: Stack[];
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
            Items: src.ReactionPQ.Items.map(stack => ({
                ...stack,
                StackEntries: stack.StackEntries.map(entry => ({
                    ...entry,
                    Effects: [...entry.Effects],
                })),
            })),
        },

        Mana: [...src.Mana],
    };
}