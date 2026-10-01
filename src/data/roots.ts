export type RootKey = 'trash' | 'common' | 'rare' | 'heavenly';

export interface RootDef {
  key: RootKey;
  qiMult: number;
  weight: number;
}

export const ROOTS: RootDef[] = [
  { key: 'trash', qiMult: 0.6, weight: 35 },
  { key: 'common', qiMult: 1.0, weight: 45 },
  { key: 'rare', qiMult: 1.5, weight: 17 },
  { key: 'heavenly', qiMult: 2.5, weight: 3 },
];

export function rootDef(key: RootKey): RootDef {
  return ROOTS.find((r) => r.key === key)!;
}
