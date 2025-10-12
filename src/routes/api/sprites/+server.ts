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
;
            const allowedExt = ['.png'];
            const files = fs.readdirSync(charDir).filter((file) => allowedExt.includes(path.extname(file).toLowerCase()));
            result[char] = files;

        } catch (err) {

            console.log("err", err)

        }

    }

    return json({ files: result });

};
