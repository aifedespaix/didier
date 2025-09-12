import { SpellBase, type SpellContext, type SpellResult } from "@/systems/spells/types";
import type { Character } from "@/systems/character/Character";

export type MagicBoltParams = {
  speed: number; // m/s
  range: number; // meters
  radius: number; // meters (visual and hit radius)
  damage: number; // hp
};

export class MagicBoltSpell extends SpellBase {
  constructor(private readonly params: MagicBoltParams = { speed: 24, range: 20, radius: 0.35, damage: 20 }) {
    super({ id: "primary", cooldownMs: 800, name: "Magic Bolt" });
  }

  protected execute(ctx: SpellContext, self: Character, now: number): SpellResult {
    // Trigger attack animation (mapped to standing_1h_magic_attack_01 via hints)
    ctx.setAnimOverride("attack", 500);

    // Delegate spawn to the runtime (React world) if provided
    if (ctx.spawnProjectile) {
      ctx.spawnProjectile({
        kind: "magic-bolt",
        speed: this.params.speed,
        range: this.params.range,
        radius: this.params.radius,
        damage: this.params.damage,
      });
    }

    return { ok: true, cooldownMs: this.cooldownMs };
  }
}

