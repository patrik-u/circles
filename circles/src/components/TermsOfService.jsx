import i18n from "@/i18n/Localization";
import {
    Flex,
    Box,
    Text,
    Spinner,
    Button,
    Checkbox,
    useToast,
    HStack,
    VStack,
    Tabs,
    Tab,
    TabPanel,
    TabPanels,
    TabList,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";

export const tnsLastUpdate = "2023-09-05";
let termsOfService = `# Terms of Service
## Welcome to Circles!

Circles is an open-source social networking platform for co-creators and changemakers. It functions as an open-source ecosystem, connecting individuals, movements, and political entities globally, while rooting activism and the co-creative spirit locally. By using the Circles platform, you agree to these Terms of Service.

## 1. Acceptance of Terms

By accessing or using the Circles platform (“Circles”), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (the “Terms”). If you do not accept the Terms in their entirety, you are not authorized to use Circles.

## 2. Ownership of Content

All content uploaded by users remains the intellectual property of the original creator. However, by uploading content to Circles, you grant Circles a non-exclusive, royalty-free, worldwide license to use, display, and distribute said content on the platform for the purpose of delivering our services. If you delete your account or specific content, we will make every effort to remove it from the platform, but you acknowledge that caching or references may still exist.

## 3. Availability of Service

Circles is provided “as is” and “as available”. We do not guarantee that Circles will be available at all times. We may suspend or discontinue Circles at any time, including the availability of any feature of Circles, without notice or liability.

## 4. Loss of Data

Circles is not responsible for any loss of data due to technical or other issues. We recommend that you back up your data regularly.

## 5. User Account

To fully utilize Circles and its features, you need to create a User Account. You commit to providing accurate and current information during the registration process and updating such information to keep it accurate. You are solely responsible for safeguarding your Circles password and for any activities or actions under your account, whether or not you have authorized such activities or actions. Notify us immediately of any unauthorized use of your account to help ensure your security. We cannot and will not be liable for any loss or damage arising from your failure to comply with the above.

## 6. Content Exposure
                
Using Circles means you might come across content from other users that you find offensive, indecent, or objectionable. Understand that content on Circles represents the views of its users and not necessarily those of the Circles platform. We disclaim all liability in connection with user-generated content.

## 7. Prohibited Uses

You commit to using Circles responsibly. Specifically, you must not use Circles for any illegal or unauthorized activities. This includes violating any local, state, national, or international laws, or sharing content that's harmful or offensive. You are solely accountable for all content you post or share on Circles. We reserve the right to review and remove content and may suspend or terminate user accounts that breach these Terms.

## 8. Subscription (Potential Future Changes)

While Circles is currently available to users without a premium subscription fee, we reserve the right to implement a subscription-based model in the future. This could provide access to premium features or additional benefits not available to free-tier users.

**8.1** Should Circles launch a subscription service in the future, some features that are currently available to all users may become exclusive to premium subscribers. We will notify all users of any such changes and provide a clear distinction between free and premium-exclusive features.

**8.2** Subscribers will agree to pay the fees associated with the subscription as outlined in the pricing information on the Circles website at that time.

**8.3** Users will be responsible for any taxes, fees, or other charges incurred as a result of using any future subscription service.

**8.4** Information on cancellation policies, potential fee changes, and any disputes arising from the use of the subscription service will be provided if and when such a subscription service is implemented.

**8.5** Users will be notified of any changes to Circles's service model and given ample opportunity to review and accept new terms before any premium-exclusive features or subscription-based model takes effect.

## 9. Termination

We reserve the right, in our sole discretion, to terminate your access to the platform or any related services at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of Circles, us, or third parties, or for any other reason.

## 10. Changes to Terms of Service

Circles reserves the right to modify these Terms of Service at any time. We will notify users of any significant changes via email or notifications on the platform. Your continued use of Circles after any changes to the Terms of Service will constitute your agreement to the modified Terms of Service. It's your responsibility to review the Terms of Service periodically.

## 11. Contacting Us

If you have any questions, concerns, or comments about our Terms of Service, please reach out to us at contact@socialsystems.io. We welcome feedback and will endeavor to respond to all inquiries in a timely manner.

These Terms of Service were last updated on 2023-09-05.

By using Circles, you agree to these Terms of Service.

Thank you for using Circles!
`;

let privacyPolicy = `# Privacy Policy

## About this privacy policy

Welcome to Circles, the geobased social networking platform for changemakers and co-creators. This Privacy Policy is designed to help you understand how we collect, use, disclose, and safeguard your personal data.

## What information do we collect?

**a. Personal Profile Information:** Upon registration and as you use the platform we may ask for information to fill out your changemaker profile such as name, email address, location, tags, mission, offers & needs and interests.

**b. Active Geolocation:** If authorized the app will collect your geolocation in the background and store it in the database. 

**c. Content and Conversations:** This encompasses all messages within Circles, including one-on-one private messages, circle chat and video, and AI conversations.

## How do we use your information?

**a. Platform Operations:** Your data is primarily used to drive platform functionalities, allowing you to discover, connect, and collaborate with other changemakers based on geographical proximity and shared interests.

**b. AI Enhancements:** Conversations with the AI will be accessed by the AI's creator/admins for the purpose of refining and enhancing the AI's performance and service to the individual Circle's mission.

**c. Communication:** By joining circles, you permit circle admins to communicate with you through email and push notifications.

**d. Semantic Network Creation:** We process your profile information (name, email address, tags, bio, mission, offers & needs, geolocation, etc) to create a semantic network. This helps us to better understand user interests and connections, thereby facilitating AI-assisted matchmaking and knowledge extraction. This network aids in ensuring users discover content and circles that align with their missions and interests.

## Discloseure of Your information

**a. Circle Admins:** If you are part of a circle, the admin can send messages to you.

**b. AI Conversations:** The creator/admin of the AI agent can access and review interactions you have with the AI to make necessary improvements.

## Your rights

**a. Access & Rectification:** You may access, rectify, or delete your personal data anytime.

**b. Data Portability:** Obtain and reuse your personal data across different services.

**c. Concent Withdrawal:** You can withdraw your consent, at any time.

**d. Restriction & Objection:** You may limit or object to our processing of your data.

## Data security

We use industry-standard security measures to protect your data from unauthorized access, disclosure, and destruction. However, we cannot guarantee that unauthorized third parties will never be able to defeat those measures or use your personal data for improper purposes.

## Data Retention

We retain personal data for as long as your account remains active or as long as necessary to offer our services.

## Third-Party Services

Your data is not for sale. We might collaborate with third-party services for operational purposes, like data storage. These parties are obligated to keep your data confidential and comply with GDPR regulations.

## Changes to this policy

Should we modify our Privacy Policy, we'll post updates on this page and inform you accordingly.

## How to contact us

If you have any questions, you are welcome to contact us at *contact@socialsystems.io*
`;

export const TermsOfService = () => {
    return (
        <Flex flexDirection="column" justifyContent="center" align="center">
            <Box maxWidth="700px" marginLeft="10px" marginRight="10px">
                <ReactMarkdown className="embedMarkdownContent">{termsOfService}</ReactMarkdown>
            </Box>
        </Flex>
    );
};

export const PrivacyPolicy = () => {
    return (
        <Flex flexDirection="column" justifyContent="center" align="center">
            <Box maxWidth="700px" marginLeft="10px" marginRight="10px">
                <ReactMarkdown className="embedMarkdownContent">{privacyPolicy}</ReactMarkdown>
            </Box>
        </Flex>
    );
};

export const Tnc = ({ showPrivacyPolicy }) => {
    return (
        <Tabs defaultIndex={showPrivacyPolicy ? 1 : 0}>
            <TabList>
                <Tab>Terms of Service</Tab>
                <Tab>Privacy Policy</Tab>
            </TabList>

            <TabPanels>
                <TabPanel margin="10px" padding="0px">
                    <Box
                        width="100%"
                        height="calc(100vh - 65px)"
                        borderRadius="5px"
                        border="1px solid"
                        borderColor="var(--chakra-colors-gray-200)"
                        backgroundColor="#f7f7f7"
                        overflow="auto"
                    >
                        <TermsOfService />
                    </Box>
                </TabPanel>
                <TabPanel margin="10px" padding="0px">
                    <Box
                        width="100%"
                        height="calc(100vh - 65px)"
                        borderRadius="5px"
                        border="1px solid"
                        borderColor="var(--chakra-colors-gray-200)"
                        backgroundColor="#f7f7f7"
                        overflow="auto"
                    >
                        <PrivacyPolicy />
                    </Box>
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
};
