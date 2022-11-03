import i18n from "../i18n/Localization";
import { Text, Box, Flex } from "@chakra-ui/react";

const PrivacyPolicy = () => {
    return (
        <Flex flexDirection="column" justifyContent="center" align="center">
            <Box maxWidth="700px" marginLeft="10px" marginRight="10px">
                {i18n.language === "sv" ? (
                    <>
                        <Text className="ppTitle">Integritetspolicy</Text>
                        <br />
                        <Text className="ppHeader">Om integritetspolicyn</Text>
                        <br />
                        <Text>
                            När du använder appen Circles så anförtror du oss dina uppgifter. Denna integritetspolicyn förklarar vilken data vi samlar in, i
                            vilket syfte och vilka rättigheter du har som användare.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Vilka uppgifter samlar vi in?</Text>
                        <br />
                        <Text>
                            Vid registrering så lagrar vi de uppgifter som anges vilket kan inkludera namn, e-postaddress, telefonnummer och profilbild. Med
                            ditt medgivande så lagrar vi din position som vi kan knyta till data du väljer att publicera i tjänsten som t.ex. inlägg, chat,
                            händelser, osv. Vi lagrar även personuppgifter du väljer att ange när du uppdaterar din profil, såsom biografi, plats, intressen och
                            födelsedatum. Vi lagrar de cirklar du väljer att följa eller bli medlem i. Vi lagrar även din interaktion med tjänsten, vilket kan
                            inkludera knapptryck och sidvisningar.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Hur använder vi dina uppgifter?</Text>
                        <br />
                        <Text>
                            Vid registrering och inloggning använder vi dina personuppgifter för att identifiera och autentisera dig. Vi använder din position
                            för att anpassa innehållet till dig och för andra användare. Vi lagrar din interaktion för att felsöka krascher och analysera
                            användarmönster för att kunna förbättra tjänsten. Vi använder angivna intressen för att anpassa innehållet till dig.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Dina rättigheter</Text>
                        <br />
                        <Text>
                            Du har rätt att begära information om de personuppgifter vi har om dig. Du kan begära att få uppgifter rättade eller raderade,
                            såvida det inte föreligger ett lagstadgat krav på lagring, som exempelvis bokföringsregler eller det föreligger andra legitima skäl,
                            till exempel obetalda fakturor.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Vilka kan vi komma att dela dina personuppgifter med?</Text>
                        <br />
                        <Text>
                            Vi kan dela dina uppgifter med företag som är personuppgiftsbiträden för oss. Personuppgiftsbiträden behandlar informationen för vår
                            räkning och enligt våra instruktioner för att hjälpa oss tillhandahålla Circles tjänster. Detta görs till företag som lämnar
                            garantier gällande säkerhet och sekretess för personuppgifter. Vi säljer och byter aldrig dina personuppgifter med tredje part. Vi
                            kan vidarebefordra dina personuppgifter till tredje-part, föreningar och cirklar via tjänstens funktioner, men endast efter du
                            informerats om vilken information som lämnas ut och efter du lämnat samtycke till det. Andra användare i tjänsten kan se den
                            personliga informationen som ingår i din offentliga profil och information du själv väljer att publicera genom t.ex. inlägg, chat
                            och uppladdningar.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Hur skyddar vi dina uppgifter?</Text>
                        <br />
                        <Text>
                            Circles nyttjar Firebase services för autentisering och lagring av data. Kommunikation med dessa tjänster sker krypterat via HTTPS
                            och vilande data lagras krypterat.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Så kontaktar du oss</Text>
                        <br />
                        <Text>Vid frågor är du välkommen att kontakta oss via e-post: gdpr@socialsystems.io</Text>
                    </>
                ) : (
                    <>
                        <Text className="ppTitle">Privacy Policy</Text>
                        <br />
                        <Text className="ppHeader">About this privacy policy</Text>
                        <br />
                        <Text>
                            When you use the Circles app, you entrust us with your information. This privacy policy explains what data we collect, for what
                            purpose and what rights you have as a user
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">What information do we collect?</Text>
                        <br />
                        <Text>
                            When registering, we store the information provided, which may include name, e-mail address, telephone number and profile picture.
                            With your consent, we store your position which we can link to data you choose to publish in the service such as posts, chat,
                            events, etc. We also store personal information you choose to enter when you update your profile, such as biography, location,
                            interests and date of birth. We store the circles you choose to follow or become a member of. We also store your interaction with
                            the service, which can include keystrokes and page views.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">How do we use your information? </Text>
                        <br />
                        <Text>
                            When registering and logging in, we use your personal information to identify and authenticate you. We use your position to
                            customize the content for you and other users. We store your interaction to troubleshoot crashes and analyze user patterns in order
                            to improve the service. We use specified interests to customize the content to you.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Your rights</Text>
                        <br />
                        <Text>
                            You have the right to request information about the personal information we have about you. You can request to have information
                            corrected or deleted, unless there is a statutory requirement for storage, such as accounting rules or there are other legitimate
                            reasons, for example, unpaid invoices.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">Who can we potentially share your personal information with?</Text>
                        <br />
                        <Text>
                            We can share your information with companies that are personal data assistants for us. Personal data assistants process the
                            information for our account and according to our instructions to help us provide Circles services. This is done to companies that
                            leave guarantees regarding security and confidentiality of personal data. We never sell and exchange your personal information with
                            third parties. We may pass on your personal information to third parties, associations and circles through the functions of the
                            service, but only after you're informed about the information provided and after you have given your consent. Other users of the
                            service can see the personal information included in your public profile and information you choose to publish through e.g. posts,
                            chat and uploads.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">How do we protect your information?</Text>
                        <br />
                        <Text>
                            Circles uses Firebase services for authentication and storage of data. Communication with these services is encrypted using HTTPS
                            and resting data is stored encrypted.
                        </Text>
                        <br />
                        <br />
                        <Text className="ppHeader">How to contact us</Text>
                        <br />
                        <Text>If you have any questions, you are welcome to contact us by e-mail: gdpr@socialsystems.io</Text>
                    </>
                )}
            </Box>
        </Flex>
    );
};

export default PrivacyPolicy;
