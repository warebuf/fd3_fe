
import { writable } from "svelte/store";

export type GameState = {
    
};

export const game = writable<GameState | null>(null);