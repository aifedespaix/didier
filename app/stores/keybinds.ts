import { defineStore } from 'pinia'

export type Key = string
export type ActionSlot = 'primary' | 'secondary' | 'tertiary' | 'ultimate'

export type KeyBindings = Record<ActionSlot, Key[]>

const STORAGE_KEY = 'keybinds_v1'

export const DEFAULT_BINDINGS: KeyBindings = {
  primary: ['a'],
  secondary: ['z'],
  tertiary: ['e'],
  ultimate: ['r'],
}

function normalizeKey(k: string): Key {
  return k.toLowerCase()
}

function cloneBindings(b: KeyBindings): KeyBindings {
  return {
    primary: [...b.primary],
    secondary: [...b.secondary],
    tertiary: [...b.tertiary],
    ultimate: [...b.ultimate],
  }
}

function validateNoConflicts(b: KeyBindings): void {
  const seen = new Map<Key, ActionSlot>()
  (Object.keys(b) as ActionSlot[]).forEach((slot) => {
    for (const key of b[slot]) {
      const k = normalizeKey(key)
      if (seen.has(k) && seen.get(k) !== slot)
        throw new Error(`Key '${k}' already bound to '${seen.get(k)}'`)
      seen.set(k, slot)
    }
  })
}

function loadFromStorage(): KeyBindings | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw)
      return null
    const parsed = JSON.parse(raw) as unknown
    const obj = parsed as Partial<Record<ActionSlot, string[]>>
    const merged: KeyBindings = {
      primary: (obj.primary ?? DEFAULT_BINDINGS.primary).map(normalizeKey),
      secondary: (obj.secondary ?? DEFAULT_BINDINGS.secondary).map(normalizeKey),
      tertiary: (obj.tertiary ?? DEFAULT_BINDINGS.tertiary).map(normalizeKey),
      ultimate: (obj.ultimate ?? DEFAULT_BINDINGS.ultimate).map(normalizeKey),
    }
    validateNoConflicts(merged)
    return merged
  }
  catch {
    return null
  }
}

function saveToStorage(b: KeyBindings): void {
  try {
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(b))
  }
  catch {
    // ignore persistence errors
  }
}

export const useKeybindStore = defineStore('keybinds', {
  state: () => ({
    bindings: loadFromStorage() ?? cloneBindings(DEFAULT_BINDINGS),
  }),
  getters: {
    keyToAction: (state) => {
      const map = new Map<Key, ActionSlot>()
      ;(Object.keys(state.bindings) as ActionSlot[]).forEach((slot) => {
        for (const k of state.bindings[slot])
          map.set(normalizeKey(k), slot)
      })
      return (key: string): ActionSlot | null => map.get(normalizeKey(key)) ?? null
    },
  },
  actions: {
    resetDefaults() {
      this.bindings = cloneBindings(DEFAULT_BINDINGS)
      saveToStorage(this.bindings)
    },
    setAll(next: KeyBindings) {
      const normalized: KeyBindings = {
        primary: next.primary.map(normalizeKey),
        secondary: next.secondary.map(normalizeKey),
        tertiary: next.tertiary.map(normalizeKey),
        ultimate: next.ultimate.map(normalizeKey),
      }
      validateNoConflicts(normalized)
      this.bindings = normalized
      saveToStorage(this.bindings)
    },
    addKey(slot: ActionSlot, key: string): boolean {
      const k = normalizeKey(key)
      // prevent same key on multiple actions
      const owner = this.getOwnerOfKey(k)
      if (owner && owner !== slot)
        return false
      const list = this.bindings[slot]
      if (!list.includes(k))
        list.push(k)
      saveToStorage(this.bindings)
      return true
    },
    removeKey(slot: ActionSlot, key: string): void {
      const k = normalizeKey(key)
      const list = this.bindings[slot]
      const idx = list.indexOf(k)
      if (idx >= 0)
        list.splice(idx, 1)
      saveToStorage(this.bindings)
    },
    rebindKey(slot: ActionSlot, oldKey: string, newKey: string): boolean {
      const kOld = normalizeKey(oldKey)
      const kNew = normalizeKey(newKey)
      const owner = this.getOwnerOfKey(kNew)
      if (owner && owner !== slot)
        return false
      const list = this.bindings[slot]
      const idx = list.indexOf(kOld)
      if (idx >= 0)
        list.splice(idx, 1, kNew)
      else if (!list.includes(kNew))
        list.push(kNew)
      saveToStorage(this.bindings)
      return true
    },
    getOwnerOfKey(key: string): ActionSlot | null {
      const k = normalizeKey(key)
      const entries = Object.entries(this.bindings) as [ActionSlot, Key[]][]
      const found = entries.find(([, keys]) => keys.includes(k))
      return found ? found[0] as ActionSlot : null
    },
  },
})

