import type { GameState } from "../engine/gameState";
import { cloneGameState } from "../engine/gameState";
import type { EventLog } from "../engine/logs";

export const DEBUG_TRACE = true;

/*
//
// to download the json file, call downloadTrace() from the debugger
//
*/

type TraceEntry = {
    log: EventLog;
    state: GameState;
};

const entries: TraceEntry[] = [];

export function recordTrace(log: EventLog, state: GameState) {
    if (!DEBUG_TRACE) return;
    entries.push({ log, state: cloneGameState(state) });
}

export function downloadTrace() {
    const json = JSON.stringify(entries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function clearTrace() {
    entries.length = 0;
}

if (DEBUG_TRACE && typeof window !== 'undefined') {
    (window as any).downloadTrace = downloadTrace;
    (window as any).clearTrace = clearTrace;
}
