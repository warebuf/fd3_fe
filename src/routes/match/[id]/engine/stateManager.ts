
import { writable } from "svelte/store";

import type { GameState } from "./gameState"

type EventResults = {
    str: string;
}

type Event = EventResults | GameState;

export const currentState = writable<GameState | null>(null);

class stateManager {

    private scheduled: Event[] = [];

    private applyScheduled() {
        
    }

    handleFullState(msg: string) {
        console.log("handleFullState");
        console.log("msg", msg);
    }

}