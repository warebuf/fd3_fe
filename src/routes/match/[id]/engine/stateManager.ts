
import { writable } from "svelte/store";

import type { GameState } from "./gameState"


export const currentState = writable<GameState | null>(null);

class stateManager {
    
}