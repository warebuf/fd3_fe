
import type { Atlas, Sprite } from "$lib/sprites/sprites";

export function increment(

    atlas: Atlas[],
    sprite: Sprite,

) {
    
    let newCharacter = false;
    let newImgIdx = sprite.imgIdx + 1;
    const keys = Object.keys(atlas[sprite.atlasIdx].images);
    if(newImgIdx >= keys.length) {
        newImgIdx = 0;
        newCharacter = true;
    }

    let newIdx = sprite.atlasIdx;
    if(newCharacter) {
        newIdx = newIdx + 1;
        if(newIdx >= atlas.length) {
            newIdx = 0;
        }
    }

    sprite.atlasIdx = newIdx;
    sprite.imgIdx = newImgIdx;
    sprite.durationIdx = 0;
    sprite.frameTime = 0;

}

export function decrement( atlas: Atlas[], sprite: Sprite ) {

    if (!atlas?.length) return;
  
    let newCharacter = false;
    let newImgIdx = sprite.imgIdx - 1;
  
    // If we go before frame 0, move to previous character
    if (newImgIdx < 0) {
      newCharacter = true;
    }
  
    let newIdx = sprite.atlasIdx;
  
    if (newCharacter) {
      newIdx = newIdx - 1;
      if (newIdx < 0) {
        newIdx = atlas.length - 1; // wrap to last character
      }

      const keys = Object.keys(atlas[newIdx].images);
      newImgIdx = keys.length - 1; // jump to last frame of previous sprite
    }
  
    sprite.atlasIdx = newIdx;
    sprite.imgIdx = newImgIdx;
    sprite.durationIdx = 0;
    sprite.frameTime = 0;
    
  }