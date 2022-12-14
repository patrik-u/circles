//#region imports
import React from "react";
import { Menu, MenuButton, MenuDivider, MenuItem, Button, Center, Avatar, MenuList, useDisclosure, Image } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import i18n from "i18n/Localization";
import { routes, openCircle } from "components/Navigation";
import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, userAtom } from "components/Atoms";
import { defaultUserPicture } from "components/Constants";
import { userSignOut } from "components/AccountManager";
import { useNavigateNoUpdates } from "components/RouterUtils";
//#endregion

export const ProfileMenu = () => {
    log("ProfileMenu.render", -1);

    const navigate = useNavigateNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [user, setUser] = useAtom(userAtom);
    const circlePictureSizeInt = isMobile ? 30 : 48;
    const circlePictureSize = `${circlePictureSizeInt}px`;
    const { isOpen: profileMenuIsOpen, onOpen: profileMenuOnOpen, onClose: profileMenuOnClose } = useDisclosure();
    const displayProfile = signInStatus.signedIn || (signInStatus.signingIn && user?.picture);

    const onSignOutClick = () => {
        profileMenuOnClose();
        userSignOut(setUser);
    };

    return (
        displayProfile && (
            <Menu
                closeOnBlur="true"
                onClose={profileMenuOnClose}
                onOpen={profileMenuOnOpen}
                isOpen={profileMenuIsOpen}
                margin="0px"
                padding="0px"
                width={circlePictureSize}
                height={circlePictureSize}
            >
                <MenuButton
                    as={Button}
                    rounded={"full"}
                    variant={"link"}
                    cursor={"pointer"}
                    width={circlePictureSize}
                    height={circlePictureSize}
                    margin="0px"
                    padding="0px"
                >
                    <Image
                        src={getImageKitUrl(user?.picture ?? defaultUserPicture, circlePictureSizeInt, circlePictureSizeInt)}
                        width={circlePictureSize}
                        height={circlePictureSize}
                        borderRadius="50%"
                        fallbackSrc={getImageKitUrl(defaultUserPicture, circlePictureSizeInt, circlePictureSizeInt)}
                    />
                </MenuButton>
                <MenuList alignItems={"center"} borderRadius="20" zIndex="60">
                    <br />
                    <Center>
                        <Avatar
                            alignSelf="center"
                            cursor="pointer"
                            size={"2xl"}
                            src={getImageKitUrl(user?.picture ?? defaultUserPicture, 128, 128)}
                            onClick={() => {
                                profileMenuOnClose();
                                openCircle(navigate, user?.id);
                            }}
                        />
                    </Center>
                    <br />
                    <Center
                        cursor="pointer"
                        onClick={() => {
                            profileMenuOnClose();
                            openCircle(navigate, user?.id);
                        }}
                    >
                        <strong>{user?.name}</strong>
                    </Center>
                    <br />
                    <MenuDivider />
                    <MenuItem onClick={() => openCircle(navigate, user?.id)}>{i18n.t("my profile")}</MenuItem>
                    <MenuItem onClick={() => navigate(routes.circle(user?.id).settings.home)}>{i18n.t("my settings")}</MenuItem>
                    <MenuDivider />
                    <Center>
                        <Button
                            onClick={onSignOutClick}
                            display="inline-flex"
                            fontSize={"sm"}
                            fontWeight={600}
                            color={"#333"}
                            href={"#"}
                            variant="outline"
                            borderRadius="full"
                        >
                            {i18n.t("log out")}
                        </Button>
                    </Center>
                </MenuList>
            </Menu>
        )
    );
};

export default ProfileMenu;
