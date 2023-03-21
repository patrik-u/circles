import i18n from "i18n/Localization";

export const defaultContentWidth = "435px";
export const defaultCoverHeight = { default: 464, mobile: 250 };
export const signInStatusValues = {
    signedIn: { signedIn: true, fbAuth: true, signingIn: false },
    firebaseSignedOut: { signedIn: false, fbAuth: false, signingIn: false },
    userSignedOut: { signedIn: false, fbAuth: false, signingIn: false },
    signingIn: { signedIn: false, signingIn: true },
    userSigningOut: { signedIn: false, signingIn: false },
    circlesSignInFailed: { signedIn: false, fbAuth: true, signingIn: false },
};
export const circleSubSections = {
    default: { showMembers: true, showTags: true },
    home: { showMembers: true, showTags: true },
    circles: { showMembers: true, showTags: true },
    chat: { showMembers: true, showTags: true },
};
export const displayModes = { default: "default", map: "map", map_only: "map_only" };
export const defaultUserPicture = "/default-user-picture.png";
export const allQuestions = [
    {
        id: "ideal-future",
        label: i18n.t("My ideal future looks like"),
        type: ["user"],
    },
    {
        id: "insufferable-present",
        label: i18n.t("My insufferable present is"),
        type: ["user"],
    },
    {
        id: "excited-about-now",
        label: i18n.t("Right now I'm excited about"),
        type: ["user"],
    },
    {
        id: "my-superpower",
        label: i18n.t("My superpower is"),
        type: ["user"],
    },
    {
        id: "role-of-species",
        label: i18n.t("I think the role of our species on the planet is"),
        type: ["user"],
    },
    {
        id: "my-biggest-fear-is",
        label: i18n.t("My biggest fear is"),
        type: ["user"],
    },
    {
        id: "adopted-ritual",
        label: i18n.t("One ritual I have adopted is"),
        type: ["user"],
    },
    {
        id: "lottery",
        label: i18n.t("If I won the lottery tomorrow I would"),
        type: ["user"],
    },
    {
        id: "ideal-world",
        label: i18n.t("My ideal world looks like"),
        type: ["user"],
    },
    {
        id: "president",
        label: i18n.t("If I were president, I would"),
        type: ["user"],
    },
    {
        id: "three-words",
        label: i18n.t("Three words to describe my personality are"),
        type: ["user"],
    },
    {
        id: "advice",
        label: i18n.t("My advice to my younger self would be"),
        type: ["user"],
    },
    {
        id: "vulnerable",
        label: i18n.t("I feel vulnerable when"),
        type: ["user"],
    },
    {
        id: "prediction",
        label: i18n.t("My best prediction for what the world will look like in 2100"),
        type: ["user"],
    },
    {
        id: "mantra",
        label: i18n.t("My mantra is"),
        type: ["user"],
    },
    {
        id: "values",
        label: i18n.t("The values I hold most sacred are"),
        type: ["user"],
    },
    {
        id: "changemaking",
        label: i18n.t("I got into changemaking because"),
        type: ["user"],
    },
    {
        id: "impactful-project",
        label: i18n.t("My most impactful project so far has been"),
        type: ["user"],
    },
    {
        id: "crazy-idea",
        label: i18n.t("My craziest idea is"),
        type: ["user"],
    },
    {
        id: "quote",
        label: i18n.t("A quote that means a lot to me is"),
        type: ["user"],
    },
    {
        id: "work-on",
        label: i18n.t("I really need to work on"),
        type: ["user"],
    },
    {
        id: "want-to-work-on",
        label: i18n.t("I really want to work on"),
        type: ["user"],
    },
    {
        id: "sport",
        label: i18n.t("My favorite sport is"),
        type: ["user"],
    },
    {
        id: "ilikewhenhumans",
        label: i18n.t("I like it when humans"),
        type: ["user"],
    },
    {
        id: "memory",
        label: i18n.t("A significant memory or moment in my life was"),
        type: ["user"],
    },
    {
        id: "peoplecomewhen",
        label: i18n.t("People come to me when they need"),
        type: ["user"],
    },
    {
        id: "happy",
        label: i18n.t("What makes me truly happy is"),
        type: ["user"],
    },
    {
        id: "look-up-to",
        label: i18n.t("A person I look up to is... because..."),
        type: ["user"],
    },
    {
        id: "poem",
        label: i18n.t("A poem I find meaningful"),
        type: ["user"],
    },
    {
        id: "inspires",
        label: i18n.t("What inspires me is"),
        type: ["user"],
    },
    {
        id: "intrinsic",
        label: i18n.t("My intrinsic motivation is"),
        type: ["user"],
    },
    {
        id: "music",
        label: i18n.t("My favorite music is"),
        type: ["user"],
    },
    {
        id: "food",
        label: i18n.t("My favorite food is"),
        type: ["user"],
    },
    {
        id: "inserviceof",
        label: i18n.t("I show up in service of"),
        type: ["user"],
    },
    {
        id: "favoriteproject",
        label: i18n.t("My favorite changemaking project in the world is"),
        type: ["user"],
    },
    {
        id: "weaknesses",
        label: i18n.t("The weaknesses of my greatest strength are"),
        type: ["user"],
    },
    {
        id: "favoritequestion",
        label: i18n.t("My favorite question is"),
        type: ["user"],
    },
];
