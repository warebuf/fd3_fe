// minHeap.ts
import type { Timestamp } from "./gameState";

export class MinHeap<T extends Timestamp> {
  private data: T[] = [];

  get size(): number {
    return this.data.length;
  }

  peek(): T {
    return this.data[0];
  }

  push(item: T): void {
    this.data.push(item);
    this.heapUp(this.data.length - 1);
  }

  pop(): T | undefined {
    const n = this.data.length;
    if (n === 0) return undefined;
    if (n === 1) return this.data.pop();

    const root = this.data[0];
    this.data[0] = this.data.pop() as T;
    this.heapDown(0);
    return root;
  }

  private heapUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.data[parent].UpdateID <= this.data[index].UpdateID) break;
      this.swap(index, parent);
      index = parent;
    }
  }

  private heapDown(index: number): void {
    const n = this.data.length;

    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (
        left < n &&
        this.data[left].UpdateID < this.data[smallest].UpdateID
      ) {
        smallest = left;
      }

      if (
        right < n &&
        this.data[right].UpdateID < this.data[smallest].UpdateID
      ) {
        smallest = right;
      }

      if (smallest === index) break;

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  }
}
