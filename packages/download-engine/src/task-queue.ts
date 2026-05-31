export class TaskQueue {
  private readonly pending: string[] = [];
  private readonly active = new Set<string>();

  constructor(private limit: number) {}

  setLimit(limit: number): void {
    this.limit = Math.max(1, limit);
  }

  enqueue(id: string): void {
    if (!this.pending.includes(id) && !this.active.has(id)) this.pending.push(id);
  }

  remove(id: string): void {
    const index = this.pending.indexOf(id);
    if (index >= 0) this.pending.splice(index, 1);
    this.active.delete(id);
  }

  next(): string | undefined {
    if (this.active.size >= this.limit) return undefined;
    const id = this.pending.shift();
    if (id) this.active.add(id);
    return id;
  }

  complete(id: string): void {
    this.active.delete(id);
  }

  get activeCount(): number {
    return this.active.size;
  }
}
