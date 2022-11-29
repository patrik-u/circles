import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { signInStatusValues } from "./Constants";
import { isMobile as detectIsMobile } from "react-device-detect";

// misc
export const isMobileAtom = atom(detectIsMobile);

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atomWithStorage(null);
export const userDataAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);

// circle atoms
export const circleAtom = atom(null);
export const showNetworkLogoAtom = atom(false);
export const chatCircleAtom = atom(null);
export const circleIdAtom = atom(null);
