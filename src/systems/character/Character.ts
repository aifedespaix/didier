import type { CharacterProps, ForwardDir } from "@/systems/character/types";
import type { RigidBodyApi } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";
import { Health } from "@/systems/character/stats";
import { LevelState } from "@/systems/character/level";
import type { SpellBase } from "@/systems/spells/types";
import { DashSpell } from "@/systems/spells/DashSpell";

export class Character {
  readonly speed: number;
  readonly dashSpeed: number;
  readonly dashDurationMs: number;
  readonly skin = this.props.skin;
  readonly hp: Health;
  readonly level: LevelState;
  readonly spells: Map<string, SpellBase> = new Map();

  constructor(private readonly props: CharacterProps) {
    this.speed = props.speed;
    this.dashSpeed = props.dash.speed;
    this.dashDurationMs = props.dash.durationMs;
    this.hp = new Health(100);
    this.level = new LevelState(1, 0);
    // Default spell loadout
    this.spells.set("dash", new DashSpell());
  }

  /**
   * Compute forward direction on XZ from a visual quaternion, with a fallback
   * to current linear velocity if quaternion is missing.
   */
  getForwardXZ(q: Quaternion | null | undefined, body: RigidBodyApi | null): ForwardDir {
    if (q) {
      const v = new Vector3(0, 0, 1).applyQuaternion(q);
      const len = Math.hypot(v.x, v.z) || 1;
      return { x: v.x / len, z: v.z / len };
    }
    const lv = body?.linvel();
    const len = lv ? Math.hypot(lv.x, lv.z) : 0;
    if (lv && len > 1e-6) return { x: lv.x / len, z: lv.z / len };
    return { x: 0, z: 1 };
  }

  /**
   * Set the body velocity to a dash along the forward direction.
   */
  applyDashVelocity(body: RigidBodyApi, q: Quaternion | null | undefined) {
    const f = this.getForwardXZ(q, body);
    const cur = body.linvel();
    body.setLinvel({ x: f.x * this.dashSpeed, y: cur.y, z: f.z * this.dashSpeed }, true);
    return f;
  }

  getSpell(id: string): SpellBase | undefined {
    return this.spells.get(id);
  }
}
