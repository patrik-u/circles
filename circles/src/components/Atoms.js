import { atom, atomWithStorage, useAtom } from "jotai";
import { signInStatusValues } from "./Constants";

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atom(null);
export const userDataAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);
