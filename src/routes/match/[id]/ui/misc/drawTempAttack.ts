

import type { Atlas, Sprite } from "../bitmaps/loadSprites"

let sprite : Sprite = {
      durationIdx: 0,
      frameTime: 0,
}

let phase = 0;

function getAtlasIndex( atlas : Atlas ) : number {

      let actionIndex = 5;

      if(phase === 0) { // idle
            actionIndex = 1;
      } else if(phase === 1) {
            actionIndex = 4;
      } else if(phase === 2) {
            actionIndex = 5;
      }

      return atlas.actionToImageIdx[actionIndex];

}

// TODO: add the anchor points to the Atlas

export function drawTempAttack( ctx: CanvasRenderingContext2D, atlasMap: Record<number, Atlas>, dt: number ) {

      const modelIndex = 2;
      const atlas = atlasMap[modelIndex];

      // do calculation
      sprite.frameTime += dt;
      
      // figure out what is the duration arr for this iteration
      let atlasIndex = getAtlasIndex(atlas);
      let instructions = atlas.instructions[atlasIndex];
      let durations = instructions.duration;


      while( sprite.frameTime >= durations[sprite.durationIdx] * 1000 / 30 ) {
            sprite.frameTime -= durations[sprite.durationIdx] * 1000 / 30;
            sprite.durationIdx += 1;
            if(sprite.durationIdx >= durations.length) {
                  sprite.durationIdx = 0;
                  phase += 1;
                  if(phase >= 3) {
                        phase = 0;
                  }

                  atlasIndex = getAtlasIndex(atlas);
                  instructions = atlas.instructions[atlasIndex];
                  durations = instructions.duration;
            }
      }
      
      const width = instructions.width;
      const height = instructions.height;


      ctx.drawImage(
        atlas.images[atlasIndex], 
        sprite.durationIdx * width, 0, // top left corner of frame
        width, height, // frame dimensions
        500, 500, // destination coordinates
        width, height, // destination dimensions
    );


}