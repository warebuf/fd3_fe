
import { get } from "svelte/store";

import type { GameState, Timestamp } from "./gameState"
import { MinHeap } from "./timestampMinHeap"
import { serverClockOffset } from "../networking/ping";

type EventResults = Timestamp & { // extends the interface
    Timestamp: number; // just here to remind myself we are fulfilling Timestamp interface
    str: string;
}

type Event = EventResults | GameState;

export class StateManager {

    private scheduled = new MinHeap<Event>();
    
    ApplyScheduled(currentState: GameState, currentTime: number) {
        for(;this.scheduled.size > 0;) {
            const nextEvent = this.scheduled.peek();
            const eventTime = nextEvent.Timestamp - get(serverClockOffset); // normalize with clock offset
            if( currentTime >= eventTime ) { // an event has passed
                this.scheduled.pop();
                if("str" in nextEvent) { // EventResult
                    console.log("EventResult");
                } else { // GameState
                    console.log("nextEvent", nextEvent.Timestamp);
                    currentState = nextEvent;
                }
            } else {
                break;
            }
        }
    }

    handleFullState(state: GameState) {
        this.scheduled.push(state);
    }

}