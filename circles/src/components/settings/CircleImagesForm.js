//#region imports
import { useRef, useState } from "react";
import { Form, Field, Formik } from "formik";
import { Box, FormControl, FormLabel, FormErrorMessage, Flex, InputGroup, HStack, VStack, Text, Image, Icon, Button, useToast } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { FiFile } from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "components/Firebase";
import { getMetaImage } from "components/Helpers";
import axios from "axios";
import { i18n } from "i18n/Localization";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleImagesForm = ({ circle, isUpdateForm, onCancel, onNext, onUpdate, isGuideForm }) => {
    const [circlePicturePreview, setCirclePicturePreview] = useState();
    const [circleCoverPreview, setCircleCoverPreview] = useState();
    const circlePictureUploadRef = useRef();
    const circleCoverUploadRef = useRef();
    const toast = useToast();

    const handleCirclePictureUploadClick = () => {
        circlePictureUploadRef.current?.click();
    };

    const handleCircleCoverUploadClick = () => {
        circleCoverUploadRef.current?.click();
    };

    if (!circle) return null;

    return (
        <Formik
            initialValues={{ picture: circle?.picture ?? "", cover: circle?.cover ?? "" }}
            onSubmit={async (values, actions) => {
                let anyUpdated = false;
                // upload picture and cover image
                try {
                    let pictureUrl = isUpdateForm === true ? circle.picture : undefined;
                    if (values.picture) {
                        //console.log("want to update picture to:", values.picture);
                        //console.log("current picture:", picture);
                        // upload picture
                        if (isUpdateForm === false || values.picture !== circle.picture) {
                            const pictureRef = ref(storage, `circles/${circle.id}/public/picture`);
                            await uploadBytes(pictureRef, values.picture);
                            pictureUrl = await getDownloadURL(pictureRef);
                            anyUpdated = true;
                        }
                    }

                    let coverUrl = isUpdateForm === true ? circle.cover : undefined;
                    if (values.cover) {
                        // upload cover
                        if (isUpdateForm === false || values.cover !== circle.cover) {
                            const coverRef = ref(storage, `circles/${circle.id}/public/cover`);
                            await uploadBytes(coverRef, values.cover);
                            coverUrl = await getDownloadURL(coverRef);
                            anyUpdated = true;
                        }
                    }

                    // update circle picture and cover image path
                    if (anyUpdated) {
                        let updatedCircleData = {};
                        if (pictureUrl) {
                            updatedCircleData.picture = pictureUrl;
                        }
                        if (coverUrl) {
                            updatedCircleData.cover = coverUrl;
                        }

                        //console.log("updating circle data", updatedCircleData);

                        // update circle data
                        try {
                            await axios.put(`/circles/${circle.id}`, {
                                circleData: updatedCircleData,
                            });
                        } catch (err) {
                            console.log(err);
                        }

                        if (onUpdate) {
                            onUpdate(updatedCircleData);
                        }
                    }
                } catch (error) {
                    toast({
                        title: i18n.t("Images couldn't be uploaded"),
                        status: "error",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }

                actions.setSubmitting(false);

                // proceed to next step
                if (onNext) {
                    onNext();
                }

                if (isUpdateForm && anyUpdated) {
                    toast({
                        title: i18n.t("Images saved"),
                        status: "success",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }
            }}
            validate={(values) => {
                const errors = {};
                // TODO validate image sizes
                // console.log({
                //     fileName: values.picture.name,
                //     type: values.picture.type,
                //     size: `${values.picture.size} bytes`,
                // });
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t(`Choose images for ${circle.type}`)}</Text>

                        <Flex flexDirection="column">
                            <Box
                                className="circleItem"
                                align="center"
                                borderRadius="25px"
                                role="group"
                                color="black"
                                bg="white"
                                overflow="hidden"
                                position="relative"
                                border="1px solid #ebebeb"
                                height="300px"
                            >
                                <Box width="100%" height="40%" backgroundColor="#b9b9b9" overflow="hidden">
                                    {!isUpdateForm && circleCoverPreview && (
                                        <Image className="circle-overview-cover" src={circleCoverPreview} objectFit="cover" width="100%" height="100%" />
                                    )}

                                    {isUpdateForm && circleCoverPreview && (
                                        <Image className="circle-overview-cover" src={circleCoverPreview} objectFit="cover" width="100%" height="100%" />
                                    )}

                                    {!circle.cover && !circleCoverPreview && getMetaImage(circle.meta_data) && (
                                        <Image
                                            className="circle-overview-cover"
                                            src={getMetaImage(circle.meta_data)}
                                            objectFit="cover"
                                            width="100%"
                                            height="100%"
                                        />
                                    )}
                                    {isUpdateForm && !circleCoverPreview && circle.cover && (
                                        <Image className="circle-overview-cover" src={circle.cover} objectFit="cover" width="100%" height="100%" />
                                    )}
                                </Box>
                                {circle?.type !== "post" && (
                                    <Box height="76px" position="relative" top="-38px">
                                        {!isUpdateForm && circlePicturePreview && (
                                            <Image marginTop="3.5px" className="circle-list-picture" src={circlePicturePreview} />
                                        )}

                                        {isUpdateForm && circlePicturePreview && (
                                            <Image marginTop="3.5px" className="circle-list-picture" src={circlePicturePreview} />
                                        )}
                                        {isUpdateForm && !circlePicturePreview && circle.picture && (
                                            <Image marginTop="3.5px" className="circle-list-picture" src={circle.picture} />
                                        )}

                                        {!circlePicturePreview && !circle.picture && (
                                            <Box marginTop="3.5px" className="circle-list-picture" backgroundColor="#999" />
                                        )}
                                    </Box>
                                )}

                                <VStack align="center" spacing="12px" marginTop={circle?.type === "post" ? "0px" : "-28px"}>
                                    <Text className="circle-list-title" fontSize="18px" fontWeight="500">
                                        {circle.name}
                                    </Text>
                                    <Box>
                                        <Box marginLeft="10px" marginRight="10px">
                                            <Text fontSize="14px" maxWidth="170px">
                                                {circle.description}
                                            </Text>
                                        </Box>
                                    </Box>
                                </VStack>
                            </Box>

                            <VStack align="center" spacing="25px" marginLeft="25px" marginRight="25px" marginTop="10px">
                                {circle?.type !== "post" && (
                                    <Field name="picture">
                                        {({ field, form }) => (
                                            <FormControl isInvalid={form.errors.picture && form.touched.picture}>
                                                <FormLabel>{i18n.t("Logo")}</FormLabel>
                                                <InputGroup>
                                                    <input
                                                        name="picture"
                                                        ref={circlePictureUploadRef}
                                                        type="file"
                                                        multiple={false}
                                                        accept="image/*"
                                                        hidden
                                                        onChange={(event) => {
                                                            let selectedFile = event.currentTarget.files[0];
                                                            setFieldValue("picture", selectedFile);

                                                            let newPictureUrl = URL.createObjectURL(selectedFile);
                                                            setCirclePicturePreview(newPictureUrl);
                                                            form.touched.picture = true;
                                                        }}
                                                    />
                                                </InputGroup>
                                                <HStack align="center" spacing="15px">
                                                    <Button leftIcon={<Icon as={FiFile} />} onClick={handleCirclePictureUploadClick}>
                                                        {circle.type === "user" ? i18n.t(`Choose profile picture`) : i18n.t(`Choose logo`)}
                                                    </Button>
                                                    {!form.errors.picture && form.touched.picture && <CheckIcon color="green.500" />}
                                                </HStack>
                                                <Text>{values?.file?.name}</Text>
                                                <FormErrorMessage>{form.errors.picture}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                )}

                                <Field name="cover">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.cover && form.touched.cover}>
                                            <FormLabel>{i18n.t("Cover image")}</FormLabel>
                                            <InputGroup>
                                                <input
                                                    name="cover"
                                                    ref={circleCoverUploadRef}
                                                    type="file"
                                                    multiple={false}
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(event) => {
                                                        let selectedFile = event.currentTarget.files[0];
                                                        setFieldValue("cover", selectedFile);

                                                        let newCoverUrl = URL.createObjectURL(selectedFile);
                                                        setCircleCoverPreview(newCoverUrl);
                                                        form.touched.cover = true;
                                                    }}
                                                />
                                            </InputGroup>

                                            <HStack align="center" marginTop="10px" spacing="15px">
                                                <Button leftIcon={<Icon as={FiFile} />} onClick={handleCircleCoverUploadClick}>
                                                    {i18n.t("Choose cover image")}
                                                </Button>
                                                {!form.errors.cover && form.touched.cover && <CheckIcon color="green.500" />}
                                            </HStack>

                                            <Text>{values?.file?.name}</Text>
                                            <FormErrorMessage>{form.errors.cover}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </VStack>
                        </Flex>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button
                                    colorScheme="blue"
                                    mr={3}
                                    borderRadius="25px"
                                    isLoading={isSubmitting}
                                    type="submit"
                                    lineHeight="0"
                                    width={isGuideForm ? "150px" : "auto"}
                                >
                                    {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t("Save and continue")}
                                </Button>
                                {isUpdateForm !== true && (
                                    <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSubmitting} lineHeight="0">
                                        {i18n.t("Close")}
                                    </Button>
                                )}
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default CircleImagesForm;
