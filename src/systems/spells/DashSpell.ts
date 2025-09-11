import { SpellBase, type SpellContext, type SpellResult } from "@/systems/spells/types";
import type { Character } from "@/systems/character/Character";

export class DashSpell extends SpellBase {
  constructor() {
    super({ id: "dash", cooldownMs: 700, name: "Dash" });
  }

  protected execute(ctx: SpellContext, self: Character, now: number): SpellResult {
    const f = self.applyDashVelocity(ctx.body, ctx.visualQuaternion);
    // Animation override for the dash window
    ctx.setAnimOverride("dash", self.dashDurationMs);
    return { ok: true, cooldownMs: this.cooldownMs, dash: { dir: f, until: now + self.dashDurationMs } };
  }
}

