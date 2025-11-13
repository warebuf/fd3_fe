
import { writable, get } from "svelte/store";

import type { GameState, Timestamp } from "./gameState"
import { MinHeap } from "./timestampMinHeap"
import { serverClockOffset } from "../networking/ping";

type EventResults = Timestamp & { // extends the interface
    Timestamp: number; // just here to remind myself we are fulfilling Timestamp interface
    str: string;
}

type Event = EventResults | GameState;

export const currentState = writable<GameState | null>(null);

export class StateManager {

    private scheduled = new MinHeap<Event>();
    private timer: number | null = null; // setTimeout id

    private applyScheduled() {
        console.log("called applyScheduled", Date.now())
        for(;this.scheduled.size > 0;) {
            const nextEvent = this.scheduled.peek();
            const eventTime = nextEvent.Timestamp - get(serverClockOffset); // normalize with clock offset
            if( Date.now() >= eventTime ) {
                this.scheduled.pop();
                if("str" in nextEvent) { // EventResult
                    console.log("EventResult");
                } else { // GameState
                    console.log("nextEvent", nextEvent.Timestamp)
                    currentState.set(nextEvent);
                }
            } else { // schedule
                const delay = Math.max(0, eventTime - Date.now());
                this.timer = window.setTimeout(() => {
                    this.applyScheduled();
                }, delay);
                break
            }
        }
    }

    handleFullState(state: GameState) {
        this.scheduled.push(state);
        this.applyScheduled();
    }

}