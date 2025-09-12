import { SpellBase, type SpellContext, type SpellResult } from "@/systems/spells/types";
import type { Character } from "@/systems/character/Character";

export type FireballParams = {
  speed: number;
  range: number;
  radius: number;
  damage: number;
};

export class FireballSpell extends SpellBase {
  constructor(private readonly params: FireballParams = { speed: 30, range: 25, radius: 0.42, damage: 50 }) {
    super({ id: "primary", cooldownMs: 800, name: "Fireball" });
  }

  getConfig(): FireballParams {
    return this.params;
  }

  protected execute(ctx: SpellContext, _self: Character, _now: number): SpellResult {
    // Animation is handled by Player.performCastRef; we only spawn here if hook provided
    if (ctx.spawnProjectile) {
      ctx.spawnProjectile({
        kind: "fireball",
        speed: this.params.speed,
        range: this.params.range,
        radius: this.params.radius,
        damage: this.params.damage,
      });
    }
    return { ok: true, cooldownMs: this.cooldownMs };
  }
}

export default FireballSpell;

