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

  private less(a: T, b: T): boolean {
    if (a.Timestamp !== b.Timestamp) return a.Timestamp < b.Timestamp;
    return a.UpdateID < b.UpdateID;
  }

  private heapUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.less(this.data[index], this.data[parent])) break;
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

      if (left < n && this.less(this.data[left], this.data[smallest])) {
        smallest = left;
      }

      if (right < n && this.less(this.data[right], this.data[smallest])) {
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
