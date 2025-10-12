
import type { Sprite } from "$lib/sprites/sprites";

export function increment(

    sprites: Sprite[],
    active: { idx: number, imgIdx: number},

) {
    
    let newCharacter = false;
    let newImgIdx = active.imgIdx + 1;
    const keys = Object.keys(sprites[active.idx].images);
    if(newImgIdx >= keys.length) {
        newImgIdx = 0;
        newCharacter = true;
    }

    let newIdx = active.idx;
    if(newCharacter) {
        newIdx = newIdx + 1;
        if(newIdx >= sprites.length) {
            newIdx = 0;
        }
    }

    return {idx: newIdx, imgIdx: newImgIdx}

}

export function decrement(
    sprites: Sprite[],
    active: { idx: number; imgIdx: number }
  ): { idx: number; imgIdx: number } {
    if (!sprites?.length) return active;
  
    let newCharacter = false;
    let newImgIdx = active.imgIdx - 1;
  
    // If we go before frame 0, move to previous character
    if (newImgIdx < 0) {
      newCharacter = true;
    }
  
    let newIdx = active.idx;
  
    if (newCharacter) {
      newIdx = newIdx - 1;
      if (newIdx < 0) {
        newIdx = sprites.length - 1; // wrap to last character
      }

      const keys = Object.keys(sprites[newIdx].images);
      newImgIdx = keys.length - 1; // jump to last frame of previous sprite
    }
  
    return { idx: newIdx, imgIdx: newImgIdx };
  }