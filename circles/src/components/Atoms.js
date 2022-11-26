import { atom, atomWithStorage, useAtom } from "jotai";
import { signInStatusValues } from "./Constants";
import { isMobile as detectIsMobile } from "react-device-detect";

// misc
export const isMobileAtom = atom(detectIsMobile);

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atom(null);
export const userDataAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);
