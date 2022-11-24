//#region imports
import React, { useContext } from "react";
import { Menu, MenuButton, MenuDivider, MenuItem, Button, Center, Avatar, MenuList, useDisclosure } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import IsMobileContext from "../../components/IsMobileContext";
import { getImageKitUrl } from "../../components/Helpers";
import { useNavigate } from "react-router-dom";
import i18n from "i18n/Localization";
import { routes, openCircle } from "../../components/Navigation";
const default_user_picture = "/default-user-picture.png";
//#endregion

export const ProfileMenu = ({ onSignOutClick, circle, setCircle }) => {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const isMobile = useContext(IsMobileContext);
    const circlePictureSizeInt = isMobile ? 30 : 60;
    const circlePictureSize = `${circlePictureSizeInt}px`;
    const { isOpen: profileMenuIsOpen, onOpen: profileMenuOnOpen, onClose: profileMenuOnClose } = useDisclosure();

    return (
        <Menu closeOnBlur="true" onClose={profileMenuOnClose} onOpen={profileMenuOnOpen} isOpen={profileMenuIsOpen}>
            <MenuButton as={Button} rounded={"full"} variant={"link"} cursor={"pointer"} minW={0}>
                <Avatar
                    size={"sm"}
                    w={circlePictureSize}
                    h={circlePictureSize}
                    src={getImageKitUrl(user?.picture, circlePictureSizeInt, circlePictureSizeInt) ?? default_user_picture}
                />
            </MenuButton>
            <MenuList alignItems={"center"} borderRadius="20" zIndex="60">
                <br />
                <Center>
                    <Avatar
                        alignSelf="center"
                        cursor="pointer"
                        size={"2xl"}
                        src={getImageKitUrl(user?.picture, 128, 128) ?? default_user_picture}
                        onClick={() => {
                            profileMenuOnClose();
                            openCircle(navigate, user, user.id, circle, setCircle);
                        }}
                    />
                </Center>
                <br />
                <Center
                    cursor="pointer"
                    onClick={() => {
                        profileMenuOnClose();
                        openCircle(navigate, user, user.id, circle, setCircle);
                    }}
                >
                    <strong>{user.name}</strong>
                </Center>
                <br />
                <MenuDivider />
                <MenuItem onClick={() => navigate(routes.circle(user.id).home)}>{i18n.t("my profile")}</MenuItem>
                <MenuItem onClick={() => navigate(routes.circle(user.id).settings.home)}>{i18n.t("my settings")}</MenuItem>
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
    );
};

export default ProfileMenu;
