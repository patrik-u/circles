import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { signInStatusValues, displayModes } from "./Constants";
import { isMobile as detectIsMobile } from "react-device-detect";

// misc
export const isMobileAtom = atom(detectIsMobile);
export const displayModeAtom = atom(displayModes.default);

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atomWithStorage(null);
export const userDataAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);
export const userLocationAtom = atom(null);

// circle atoms
export const circleAtom = atom(null);
export const circlesAtom = atom([]);
export const circleConnectionsAtom = atom([]);
export const showNetworkLogoAtom = atom(false);
export const chatCircleAtom = atom(null);
export const circlesFilterAtom = atom(null);

// location picker atoms
export const locationPickerActiveAtom = atom(false);
export const locationPickerPositionAtom = atom(null);
