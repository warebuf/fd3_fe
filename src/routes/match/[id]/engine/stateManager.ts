
import { get } from "svelte/store";

import type { GameState } from "./gameState"
import { cloneGameState } from "./gameState"
import { MinHeap } from "./stateMinHeap"
import { applyEffect } from "../effects/ApplyEffect"
import { serverClockOffset } from "../networking/ping";
import type { EventLog } from "./logs";
import { recordTrace } from "./debugTrace";
import { dlog } from "./debugLog";

type Event = EventLog | GameState;

export class StateManager {

    private scheduled = new MinHeap<Event>();
    
    // take the last server-sent state, iterpolate the current state based on currentTime
    Update(currentState: GameState, currentTime: number) : [GameState, boolean] {

        let significantEvent = false;

        // update
        const clockOffset = get(serverClockOffset);
        for(;this.scheduled.size > 0;) {
            const nextEvent = this.scheduled.peek();
            const eventTime = nextEvent.WallTimestamp - clockOffset;
            if( currentTime >= eventTime ) { // an event has passed
                this.scheduled.pop();
                if("Type" in nextEvent) { // EventResult
                    if (nextEvent.UpdateID <= currentState.UpdateID) {
                        continue;
                    }
                    const M = 1_000_000;
                    const logWall    = nextEvent.WallTimestamp % M;
                    const clientWall = currentTime % M;
                    const adjusted   = (currentTime + clockOffset) % M;
                    dlog(`[log type=${nextEvent.Type}] logWall=${logWall.toFixed(0)} clientWall=${clientWall.toFixed(0)} offset=${clockOffset.toFixed(0)} adjusted=${adjusted.toFixed(0)}`);
                    applyEffect(currentState, nextEvent);
                    recordTrace(nextEvent, currentState);
                    significantEvent = true;
                } else { // GameState
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