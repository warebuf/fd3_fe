import { writable } from "svelte/store";

export const ping = writable<number>(0);
