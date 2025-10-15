import { User } from 'firebase/auth';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const accountAtom = atomWithStorage<User | null>('account', null);
export const playerIdAtom = atom<string>("");
export const playerNicknameAtom = atom<string>("");
export const playerMapAtom = atom<string>("");
export const playerMapSizeAtom = atom<{width: number}>({width: 1200});
export const playerAxisAtom = atom<{x: number, y: number}>({x: 0, y: 44});

export const floorElementsAtom = atom<{ height: number }>({
    height: 44,
});