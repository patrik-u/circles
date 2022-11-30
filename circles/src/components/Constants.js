export const defaultContentWidth = "435px";
export const signInStatusValues = {
    signedIn: { signedIn: true, fbAuth: true, signingIn: false },
    firebaseSignedOut: { signedIn: false, fbAuth: false, signingIn: false },
    userSignedOut: { signedIn: false, fbAuth: false, signingIn: false },
    signingIn: { signedIn: false, signingIn: true },
    userSigningOut: { signedIn: false, signingIn: false },
    circlesSignInFailed: { signedIn: false, fbAuth: true, signingIn: false },
};
export const displayModes = { default: "default", map: "map" };
export const defaultUserPicture = "/default-user-picture.png";
