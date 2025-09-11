export class Health {
  readonly max: number;
  private _current: number;

  constructor(max: number, current?: number) {
    this.max = Math.max(1, Math.floor(max));
    this._current = Math.min(this.max, Math.max(0, Math.floor(current ?? max)));
  }

  get current(): number {
    return this._current;
  }

  get isDead(): boolean {
    return this._current <= 0;
  }

  damage(amount: number): number {
    const a = Math.max(0, Math.floor(amount));
    this._current = Math.max(0, this._current - a);
    return this._current;
  }

  heal(amount: number): number {
    const a = Math.max(0, Math.floor(amount));
    this._current = Math.min(this.max, this._current + a);
    return this._current;
  }

  set(value: number): number {
    this._current = Math.min(this.max, Math.max(0, Math.floor(value)));
    return this._current;
  }

  revive(percent: number = 1.0): number {
    const p = Math.min(1, Math.max(0, percent));
    this._current = Math.max(1, Math.floor(this.max * p));
    return this._current;
  }
}

