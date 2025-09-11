export class LevelState {
  level: number;
  xp: number;

  constructor(level = 1, xp = 0) {
    this.level = Math.max(1, Math.floor(level));
    this.xp = Math.max(0, Math.floor(xp));
  }

  get nextLevelXp(): number {
    // Simple curve: 100, 200, 300, ...
    return this.level * 100;
  }

  addXp(amount: number): { leveled: boolean } {
    let leveled = false;
    this.xp += Math.max(0, Math.floor(amount));
    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level += 1;
      leveled = true;
    }
    return { leveled };
  }
}

