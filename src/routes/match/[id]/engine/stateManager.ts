
import { get } from "svelte/store";

import type { GameState, Timestamp } from "./gameState"
import { cloneGameState } from "./gameState"
import { MinHeap } from "./stateMinHeap"
import { applyEffect } from "../effects/ApplyEffect"
import { serverClockOffset } from "../networking/ping";

export type EventLog = Timestamp & {

    // extends the interface, actually redunant semantically, but left here as a reminder
    Timestamp: number;
    UpdateID: number;
    
    Type: number;
    A: number;
    B: number;
    C: number;
}

type Event = EventLog | GameState;

export class StateManager {

    private scheduled = new MinHeap<Event>();
    
    // take the last server-sent state, iterpolate the current state based on currentTime
    Update(currentState: GameState, currentTime: number) : [GameState, boolean] {

        let significantEvent = false;

        // update
        for(;this.scheduled.size > 0;) {
            const nextEvent = this.scheduled.peek();
            const eventTime = nextEvent.Timestamp - get(serverClockOffset); // normalize with clock offset
            if( currentTime >= eventTime ) { // an event has passed
                this.scheduled.pop();
                if("Type" in nextEvent) { // EventResult
                    console.log( "applying effect for", nextEvent.Timestamp% 1000000, "adjusted to", eventTime % 1000000, "changed on", Date.now() % 1000000 )
                    applyEffect(currentState, nextEvent);
                    significantEvent = true;
                } else { // GameState
                    console.log( "applying fullstate for", nextEvent.Timestamp% 1000000, "adjusted to", eventTime % 1000000, "changed on", Date.now() % 1000000 )
                    currentState = cloneGameState(nextEvent);
                    significantEvent = true;
                }
            } else {
                break;
            }
        }

        return [currentState, significantEvent];
    }

    addFullState(state: GameState) {
        this.scheduled.push(state);
    }

    addLog(log: EventLog) {
        this.scheduled.push(log);
    }

}