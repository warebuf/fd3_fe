// src/routes/+page.ts
import { redirect } from '@sveltejs/kit';

export function load() {
	throw redirect(302, '/play');
}
