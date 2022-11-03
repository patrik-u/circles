import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { Select } from "@chakra-ui/react";

i18n
    //.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        resources: {
            en: {
                translations: require("./locales/en/translations.json"),
            },
            sv: {
                translations: require("./locales/se/translations.json"),
            },
        },
        ns: ["translations"],
        defaultNS: "translations",
    });

i18n.languages = ["en", "sv"];

export const LanguagePicker = (props) => {
    return (
        <Select id="language" {...props.field}>
            <option value="en">{i18n.t("English")}</option>
            <option value="sv">{i18n.t("Swedish")}</option>
        </Select>
    );
};

export { i18n };
export default i18n;
