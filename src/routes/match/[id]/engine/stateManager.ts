
import { get } from "svelte/store";

import type { GameState, Timestamp } from "./gameState"
import { initGameState, cloneGameState } from "./gameState"
import { MinHeap } from "./stateMinHeap"
import { serverClockOffset } from "../networking/ping";

type EventResults = Timestamp & {

    // extends the interface, just here to remind myself, harmless but redundant
    Timestamp: number;
    GameStateID: number;
    
    str: string;
}

type Event = EventResults | GameState;

export class StateManager {

    private scheduled = new MinHeap<Event>();
    private lastState : GameState = initGameState();
    
    // take the last server-sent state, iterpolate the current state based on currentTime
    Update(currentState: GameState, currentTime: number) : [GameState, boolean] {

        let significantEvent = false;

        // update
        for(;this.scheduled.size > 0;) {
            const nextEvent = this.scheduled.peek();
            const eventTime = nextEvent.Timestamp - get(serverClockOffset); // normalize with clock offset
            if( currentTime >= eventTime ) { // an event has passed
                this.scheduled.pop();
                if("str" in nextEvent) { // EventResult
                    significantEvent = true;
                } else { // GameState
                    this.lastState = nextEvent;
                    currentState = cloneGameState(this.lastState);
                    significantEvent = true;
                }
            } else {
                break;
            }
        }

        return [currentState, significantEvent];
    }

    handleFullState(state: GameState) {
        this.scheduled.push(state);
    }

}