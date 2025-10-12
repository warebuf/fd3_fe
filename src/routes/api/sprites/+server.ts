import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import fs from 'fs';
import path from 'path';


// get list of .png files for each character
export const POST: RequestHandler = async ({ request }) => {
  
    const { characters } = await request.json();
  
    console.log('characters', characters);

    const baseDir = path.resolve('static/sprites');

    const result: Record<string, string[]> = {};

    for (const char of characters) {
    
        const charDir = path.join(baseDir, char);

        try {
            
            // get all files in a directory for a character
            const files = fs.readdirSync(charDir);
            
            // get all base names
            const nameMap = new Map<string, true>();
            for (let i = 0; i < files.length; i++) {

                // only process .png files
                if (!files[i].toLowerCase().endsWith('.png')) continue;

                // split by '-' and take first part
                const baseName = files[i].split('-')[0];

                // store in map to deduplicate
                nameMap.set(baseName, true);
            }
            
            result[char] = Array.from(nameMap.keys());

        } catch (err) {

            console.log("err", err)

        }

    }

    return json(result);

};
