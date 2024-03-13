//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Flex,
    HStack,
    VStack,
    Text,
    Icon,
    Link,
    Image,
    IconButton,
    Textarea,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    useDisclosure,
    Portal,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    Spinner,
    Card,
    CardBody,
    Popover,
    PopoverTrigger,
    Modal,
    ModalBody,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    Divider,
} from "@chakra-ui/react";
import {
    getDistanceString,
    getDateAndTimeLong,
    fromFsDate,
    getDateLong,
    singleLineEllipsisStyle,
    isPastEvent,
    getEventTime,
    isConnected,
    getPostTime,
    isAdmin,
    log,
    getMetaImage,
} from "@/components/Helpers";
import {
    CirclePicture,
    CircleTags,
    ConnectButton,
    CircleCover,
    FavoriteButton,
    ShareButtonMenu,
    NotificationsBell,
    SimilarityIndicator,
    CircleRichText,
    CardIf,
    getCircleCover,
    AutoResizeTextarea,
} from "@/components/CircleElements";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, documentId, doc } from "firebase/firestore";
import db from "@/components/Firebase";
import { routes, openSubcircle, openCircle } from "@/components/Navigation";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill } from "react-icons/ri";
import { useLocationNoUpdates } from "@/components/RouterUtils";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userDataAtom,
    userAtom,
    focusOnMapItemAtom,
    highlightedCircleAtom,
    newCirclePopupAtom,
} from "@/components/Atoms";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsChatText, BsChatTextFill, BsChatFill, BsChat, BsLockFill } from "react-icons/bs";
import { CircleChat } from "@/components/CircleChat";
import axios from "axios";
import linkifyHtml from "linkify-html";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FiEdit } from "react-icons/fi";
import { DeleteIcon } from "@chakra-ui/icons";
import { circleAtom } from "./Atoms";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import Scrollbars from "react-custom-scrollbars-2";
import { IoMdSend } from "react-icons/io";
import useWindowDimensions from "./useWindowDimensions";
import { CircleMention } from "@/components/CircleSearch";
//#endregion

const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
};

export const LinkOrBox = ({ circle, useLink, children }) => {
    const [currentCircle] = useAtom(circleAtom);
    const navigate = useNavigateNoUpdates();

    return useLink ? (
        <Link
            href={routes.subcircle(currentCircle, circle)}
            onClick={(e) => {
                e.preventDefault();
                openSubcircle(navigate, currentCircle, circle);
            }}
        >
            {children}
        </Link>
    ) : (
        <Box
            cursor="pointer"
            onClick={() => {
                openSubcircle(navigate, currentCircle, circle);
            }}
        >
            {children}
        </Box>
    );
};

export const CircleNameLink = ({ circle, useLink = true, ...props }) => {
    useEffect(() => {
        log("CircleNameLink.useEffect 1", -1);
    }, []);

    return (
        <LinkOrBox circle={circle} useLink={useLink}>
            <Text {...props}>{circle.name}</Text>
        </LinkOrBox>
    );
};

export const CommentInput = ({
    circle,
    parentComment,
    isEditing = false,
    editedComment,
    onCancelEdit,
    onPublish,
    focusOnMount = false,
    ...props
}) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const textAreaRef = useRef();
    const { windowWidth, windowHeight } = useWindowDimensions();
    const [isMentioning, setIsMentioning] = useState(false); // is user currently mentioning someone
    const [mentionQuery, setMentionQuery] = useState(""); // current mention query in user input message
    const [comment, setComment] = useState(isEditing && editedComment?.content ? editedComment.content : "");
    const [mentionsList, setMentionsList] = useState([]); // list of mentions in user input text

    const upsertComment = async (commentValue) => {
        // get formatted comment
        let transformedComment = commentValue;
        mentionsList.forEach((mention) => {
            const markdownLink = `[${mention.name.slice(1)}](codo.earth/circles/${mention.id})`; // remove the '@' from the mention name
            transformedComment = transformedComment.replace(mention.name, markdownLink);
        });

        // add comment to list of comments
        let req = {
            comment: transformedComment,
        };
        if (parentComment) {
            req.parent_comment_id = parentComment.id;
        }

        // publish comment
        if (isEditing) {
            axios
                .put(`/comments/${editedComment.id}`, req)
                .then((postCommentResult) => {})
                .catch((error) => {
                    console.error(error);
                });
        } else {
            axios
                .post(`/circles/${circle.id}/comments`, req)
                .then((postCommentResult) => {})
                .catch((error) => {
                    console.error(error);
                });
        }

        if (onPublish) {
            onPublish();
        }
    };

    const handleMessageChange = (e) => {
        setComment(e.target.value);

        if (isMentioning) {
            const queryMatch = e.target.value.match(/(?:^|\s)@(\w*)$/); // This regex matches "@" only if it's at the start or after a space
            if (queryMatch) {
                setMentionQuery(queryMatch[1]);
            }
        }

        if (e.target.value.match(/(?:^|\s)@$/)) {
            setIsMentioning(true);
        } else if (e.target.value.endsWith(" ") || e.target.value.endsWith("\n")) {
            setIsMentioning(false);
        }
    };

    const handleMessageKeyDown = async (e) => {
        // if escape and editing we want to call onCancelEdit
        if (e.keyCode === 27 && onCancelEdit) {
            e.preventDefault();
            onCancelEdit();
        }

        if (!isMobile && e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            let commentValue = comment;
            setComment("");

            await upsertComment(commentValue);
        } else {
            return;
        }
    };

    const onCommentBlur = () => {};

    const onMention = (mentionedCircle) => {
        log("mentioning circle: " + mentionedCircle.name, 0, true);
        const updatedComment = comment.replace(`@${mentionQuery}`, `@${mentionedCircle.name} `);
        setComment(updatedComment);

        // add the mentioned circle to the mentions list
        const newMention = {
            id: mentionedCircle.objectID,
            name: `@${mentionedCircle.name}`,
            picture: mentionedCircle.picture,
        };

        setMentionsList((prevMentions) => [...prevMentions, newMention]);

        setIsMentioning(false);
        setMentionQuery("");

        // Set focus back to the textarea and set cursor position
        const newPosition = updatedComment.length; // Get the length of the updated message
        textAreaRef.current.focus(); // Focus the textarea
        textAreaRef.current.setSelectionRange(newPosition, newPosition); // Set the cursor position to the end of the textarea content
    };

    useEffect(() => {
        if (!focusOnMount) return;

        // focus the text area when the component mounts
        if (textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [focusOnMount]);

    return (
        <Flex flexDirection="column" position="relative" {...props}>
            <Flex flexDirection="row" align="center" position="relative">
                {isMentioning && (
                    <CircleMention onMention={onMention} query={mentionQuery} position="absolute" bottom="50px" />
                )}
                <AutoResizeTextarea
                    ref={textAreaRef}
                    id="message"
                    className="messageInput"
                    value={comment}
                    onChange={handleMessageChange}
                    onKeyDown={handleMessageKeyDown}
                    resize="none"
                    maxLength="65000"
                    rows="1"
                    borderRadius="30px"
                    maxH={`${Math.max(windowHeight - 300, 60)}px`}
                    placeholder={user?.id ? "Write a comment..." : "Log in to comment"}
                    onBlur={onCommentBlur}
                    disabled={user?.id ? false : true}
                    // backgroundColor="white"
                    backgroundColor="#f1f1f1"
                    fontSize="14px"
                />

                {isMobile && (
                    <Flex flexDirection="row" justifyContent="right" marginTop="10px">
                        <IconButton icon={<IoMdSend />} />
                    </Flex>
                )}
            </Flex>
            {parentComment && (
                <Flex flexDirection="row" marginLeft="12px">
                    <Text fontSize="10px" color="#6f6f6f" fontWeight="700">
                        Replying to {parentComment.creator.name}
                    </Text>
                </Flex>
            )}
            {isEditing && (
                <Link
                    onClick={(e) => {
                        e.preventDefault();
                        if (onCancelEdit) {
                            onCancelEdit();
                        }
                    }}
                    marginLeft="12px"
                >
                    <Text fontSize="12px" color="#6f6f6f" fontWeight="700" marginLeft="15px">
                        Cancel
                    </Text>
                </Link>
            )}
        </Flex>
    );
};

export const Comment = ({ comment, circle, ...props }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [showSubcomments, setShowSubcomments] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const displayText = useMemo(() => {
        if (!comment.parent_comment) {
            return comment.content;
        }
        return `[${comment.parent_comment.creator.name}](codo.earth/circles/${comment.parent_comment.creator.id}) ${comment.content}`;
    }, [comment.content, comment.parent_comment]);

    const onReplyClick = () => {
        setIsReplying(true);
    };

    const onLikeClick = () => {};

    useEffect(() => {
        log("Comment.useEffect 1", -1);
    }, []);

    const getMentions = (comment) => {
        let mentions = [];
        if (comment.parent_comment) {
            mentions.push(comment.parent_comment.creator);
        }
        if (comment.mentions) {
            comment.mentions.forEach((mention) => {
                mentions.push(mention);
            });
        }
        return mentions;
    };

    const onEditComment = () => {
        log("edit comment", 0, true);

        setIsEditing(true);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    return (
        <Flex flexDirection="column" {...props} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Flex flexDirection="row" align="top">
                <Box marginTop="5px">
                    <CirclePicture circle={comment.creator} size={24} hasPopover={true} />
                </Box>

                {isEditing && (
                    <Box marginLeft="5px" flexGrow="1">
                        <CommentInput
                            isEditing={true}
                            editedComment={comment}
                            onCancelEdit={() => setIsEditing(false)}
                            onPublish={() => setIsEditing(false)}
                            focusOnMount={true}
                        />
                    </Box>
                )}
                {!isEditing && (
                    <>
                        <Flex flexDirection="column">
                            <Flex
                                flexDirection="column"
                                align="start"
                                backgroundColor="#f1f1f1"
                                marginLeft="5px"
                                borderRadius="10px"
                                padding="5px 10px 5px 10px"
                            >
                                <CircleNameLink
                                    circle={comment.creator}
                                    useLink={false}
                                    fontSize="14px"
                                    fontWeight="700"
                                />

                                <Box textAlign="left" fontSize="14px" fontWeight="400">
                                    <CircleRichText mentions={getMentions(comment)} mentionsFontSize="14px">
                                        {displayText}
                                    </CircleRichText>
                                </Box>
                            </Flex>
                            <Flex flexDirection="row" marginLeft="15px" marginTop="2px">
                                <Text fontSize="12px" color="#6f6f6f">
                                    {getPostTime(comment)}
                                </Text>
                                <Link
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onLikeClick();
                                    }}
                                >
                                    <Text fontSize="12px" color="#6f6f6f" fontWeight="700" marginLeft="15px">
                                        Like
                                    </Text>
                                </Link>
                                <Link
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onReplyClick();
                                    }}
                                >
                                    <Text fontSize="12px" color="#6f6f6f" fontWeight="700" marginLeft="15px">
                                        Reply
                                    </Text>
                                </Link>
                                {comment.edited_at && (
                                    <Text fontSize="12px" color="#6f6f6f" marginLeft="15px">
                                        Edited
                                    </Text>
                                )}
                            </Flex>
                        </Flex>
                        <CommentDotsMenu
                            comment={comment}
                            onEditComment={onEditComment}
                            isHovering={isHovering}
                            alignSelf="center"
                            marginBottom="20px"
                            marginLeft="2px"
                        />
                    </>
                )}
            </Flex>
            {!showSubcomments && comment.subcomments && comment.subcomments.length > 0 && (
                <Link
                    onClick={(e) => {
                        e.preventDefault();
                        setShowSubcomments(true);
                    }}
                    marginLeft="41px"
                    marginTop="1px"
                >
                    <Text fontSize="12px" fontWeight="700" color="#6d6d6d" textAlign="left">
                        Show {comment.subcomments.length} replies
                    </Text>
                </Link>
            )}

            {showSubcomments && comment.subcomments && comment.subcomments.length > 0 && (
                <Flex flexDirection="column" marginLeft="29px" marginTop="5px">
                    {comment.subcomments.map((subcomment) => (
                        <Comment key={subcomment.id} comment={subcomment} circle={circle} marginBottom="8px" />
                    ))}
                </Flex>
            )}

            {isReplying && (
                <CommentInput
                    circle={circle}
                    parentComment={comment}
                    marginLeft="29px"
                    marginTop="2px"
                    onPublish={() => {
                        setIsReplying(false);
                    }}
                    onCancelEdit={() => {
                        setIsReplying(false);
                    }}
                    focusOnMount={true}
                />
            )}
        </Flex>
    );
};

export const Comments = ({ circle, isPreview, ...props }) => {
    const [currentCircle] = useAtom(circleAtom);
    const [comments, setComments] = useState([]);
    const [user] = useAtom(userAtom);
    const [isLoadingComments, setIsLoadingComments] = useState(true);

    useEffect(() => {
        log("Comments.useEffect 1", -1);
    }, []);

    useEffect(() => {
        if (!circle) return;
        if (isPreview) {
            if (circle.highlighted_comment) {
                setComments([circle.highlighted_comment]);
            }
        } else {
            // subscribe to comments
            const q = query(collection(db, "comments"), where("circle_id", "==", circle.id));
            const unsubscribeGetComments = onSnapshot(q, (snap) => {
                let newComments = snap.docs.map((doc) => {
                    return {
                        id: doc.id,
                        ...doc.data(),
                    };
                });

                // create a lookup object for comment IDs to comment objects
                const commentsLookup = newComments.reduce((acc, comment) => {
                    acc[comment.id] = comment;
                    return acc;
                }, {});

                // augment comments with their parent_comment object
                newComments = newComments.map((comment) => ({
                    ...comment,
                    parent_comment: commentsLookup[comment.parent_comment_id] || null,
                }));

                // filter root level comments and sort by likes
                const rootComments = newComments.filter((c) => !c.parent_comment_id).sort((a, b) => b.likes - a.likes);

                // helper function to recursively find all subcomments for a root comment
                const findAllSubcomments = (parentId) => {
                    return newComments
                        .filter((c) => c.parent_comment_id === parentId)
                        .reduce((acc, subcomment) => {
                            acc.push(subcomment, ...findAllSubcomments(subcomment.id));
                            return acc;
                        }, []);
                };

                // assign flattened subcomments to each root comment
                const commentsWithSubcomments = rootComments.map((comment) => {
                    const allSubcomments = findAllSubcomments(comment.id);

                    // sort the flattened list of subcomments chronologically
                    allSubcomments.sort((a, b) => fromFsDate(a.created_at) - fromFsDate(b.created_at));
                    return {
                        ...comment,
                        subcomments: allSubcomments,
                    };
                });

                setComments(commentsWithSubcomments);
                setIsLoadingComments(false);
            });

            return () => {
                if (unsubscribeGetComments) {
                    unsubscribeGetComments();
                }
            };
        }
    }, [isPreview, circle?.highlighted_comment]);

    return (
        <Flex flexDirection="column" {...props} marginLeft="10px" marginRight="10px">
            {isLoadingComments && !isPreview && <Spinner marginBottom="10px" />}
            {/* if preview show link "Show more comments" if there are more comments */}
            {isPreview && circle.comments > 1 && (
                <Link
                    href={routes.subcircle(currentCircle, circle)}
                    onClick={(e) => {
                        e.preventDefault();
                        openSubcircle(navigate, currentCircle, circle);
                    }}
                    target="_blank"
                    marginBottom="10px"
                >
                    <Text fontSize="14px" fontWeight="700" color="#6d6d6d" textAlign="left">
                        Show more comments
                    </Text>
                </Link>
            )}

            {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} circle={circle} marginBottom="4px" />
            ))}

            <CommentInput circle={circle} marginBottom="10px" />
        </Flex>
    );
};

export const MediaDisplay = ({ media, meta_data, mentions, ...props }) => {
    const SliderIf = ({ children, noSlider }) => {
        return noSlider ? children : <Slider {...sliderSettings}>{children}</Slider>;
    };

    const containerRef = useRef();
    const [containerWidth, setContainerWidth] = useState("100%");

    const allMedia = useMemo(() => {
        let m = media ?? [];
        let metaMedia =
            meta_data?.map((x) => ({
                name: x.title,
                is_meta_data: true,
                url: x.images[0],
                type: "image",
                link: x.url,
            })) ?? [];
        let mentionsMedia =
            mentions?.map((x) => ({
                name: x.name,
                is_mention: true,
                url: getCircleCover(x, x?.cover),
                type: "image",
                link: routes.subcircle(x?.parent_circle, x),
                circle: x,
            })) ?? [];

        return [...m, ...metaMedia, ...mentionsMedia];
    }, [media, meta_data]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(`${containerRef.current.offsetWidth}px`);
            }
        };

        // Call resize function on component mount and add event listener for future resizes
        handleResize();
        window.addEventListener("resize", handleResize);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <Box ref={containerRef} width="100%" {...props}>
            <Box width={containerWidth}>
                <SliderIf noSlider={allMedia?.length <= 1}>
                    {allMedia
                        .filter((x) => x?.url)
                        .map((media) => (
                            <Flex
                                key={media.url}
                                flexDirection="column"
                                width="100%"
                                maxWidth={containerWidth}
                                backgroundColor="white"
                            >
                                <Image src={media.url} width="100%" height="100%" objectFit="contain" />
                                {media.link && (
                                    <Link href={media.link} target="_blank">
                                        <Flex
                                            // backgroundColor="#e5e5e5"
                                            height="30px"
                                            align="center"
                                            paddingLeft="5px"
                                            paddingRight="5px"
                                            flexDir={"row"}
                                        >
                                            {media.is_mention && (
                                                <Box marginRight="5px">
                                                    <CirclePicture circle={media.circle} size={16} hasPopover={false} />
                                                </Box>
                                            )}
                                            <Text style={singleLineEllipsisStyle} fontSize="12px">
                                                {media.name}
                                            </Text>
                                        </Flex>
                                    </Link>
                                )}
                            </Flex>
                        ))}
                </SliderIf>
            </Box>
        </Box>
    );
};

export const CommentDotsMenu = ({ comment, onEditComment, isHovering, ...props }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const toast = useToast();

    if (!comment) return;

    const showDotsMenu = user?.id && comment?.creator?.id === user?.id;
    if (!showDotsMenu) return null;

    const editComment = () => {
        if (onEditComment) {
            onEditComment();
        }
    };
    const deleteComment = async () => {
        // delete comment
        try {
            onClose();

            // delete circle
            let result = null;
            result = await axios.delete(`/comments/${comment.id}`);
        } catch {}
    };

    return (
        <>
            <Menu>
                <MenuButton
                    as={IconButton}
                    icon={<HiOutlineDotsHorizontal color={isHovering ? "black" : "white"} />}
                    variant="ghost"
                    isRound="true"
                    size="sm"
                    {...props}
                ></MenuButton>
                <Portal>
                    <MenuList zIndex={1400}>
                        <MenuItem icon={<FiEdit />} onClick={editComment}>
                            Edit
                        </MenuItem>
                        <MenuItem icon={<DeleteIcon />} onClick={onOpen}>
                            Delete
                        </MenuItem>
                    </MenuList>
                </Portal>
            </Menu>
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete comment
                        </AlertDialogHeader>

                        <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={deleteComment} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export const CircleDotsMenu = ({ circle, ...props }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();
    const [userData] = useAtom(userDataAtom);
    const toast = useToast();
    const [, setNewCirclePopup] = useAtom(newCirclePopupAtom);

    if (!circle) return;

    const showDotsMenu = circle.type === "post" || circle.type === "event";
    if (!showDotsMenu) return null;

    // if user is author/admin of circle show dots menu
    if (!isAdmin(circle, userData)) return null;

    const editCircle = () => {
        setNewCirclePopup({ type: circle.type, circle: circle, isUpdateForm: true });
    };
    const deleteCircle = async () => {
        // delete circle
        let typeName = circle.type;
        typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

        try {
            onClose();
            // delete circle
            let putCircleResult = null;
            try {
                putCircleResult = await axios.delete(`/circles/${circle.id}`, {
                    data: { name_confirmation: circle.name },
                });
            } catch (err) {
                console.log(err);
            }

            if (!putCircleResult || putCircleResult.data?.error) {
                toast({
                    title: `${typeName} couldn't be deleted`,
                    description: putCircleResult?.data?.error,
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            } else {
                toast({
                    title: `${typeName} has been deleted`,
                    status: "success",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: `${typeName} couldn't be deleted`,
                description: error,
                status: "error",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <Menu>
                <MenuButton
                    as={IconButton}
                    icon={<HiOutlineDotsHorizontal />}
                    variant="ghost"
                    isRound="true"
                    size="sm"
                    {...props}
                ></MenuButton>
                <Portal>
                    <MenuList zIndex={1400}>
                        <MenuItem icon={<FiEdit />} onClick={editCircle}>
                            Edit
                        </MenuItem>
                        <MenuItem icon={<DeleteIcon />} onClick={onOpen}>
                            Delete
                        </MenuItem>
                    </MenuList>
                </Portal>
            </Menu>
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete {circle.type}
                        </AlertDialogHeader>

                        <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={deleteCircle} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );

    // <IconButton icon={<HiOutlineDotsHorizontal />} isRound="true" size="sm" variant="ghost" {...props} />;
};

const contentMargin = 10;
const contentMarginPx = contentMargin + "px";

const CircleListItemHeader = ({ item, inSelect, onClick, hasPopover = true, ...props }) => {
    const [circle] = useAtom(circleAtom);
    const navigate = useNavigateNoUpdates();

    return (
        <Flex
            align="left"
            role="group"
            color="black"
            overflow="hidden"
            position="relative"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            {...props}
        >
            <Box
                margin={contentMarginPx}
                minWidth={item.type === "post" ? "40px" : "40px"}
                minHeight={item.type === "post" ? "40px" : "40px"}
                position="relative"
            >
                <CirclePicture
                    circle={item.type === "post" ? item.creator : item}
                    size={item.type === "post" ? 40 : 40}
                    hasPopover={hasPopover}
                />
            </Box>

            <HStack spacing="0px" align="center">
                <Text
                    fontSize={"15px"}
                    fontWeight="700"
                    textAlign="left"
                    style={singleLineEllipsisStyle}
                    onClick={(e) => {
                        if (inSelect) return;
                        if (item.type === "post" || item.type === "event") {
                            // posts and events are opened in subcircle view
                            openSubcircle(navigate, item?.parent_circle, item.type === "post" ? item.creator : item);
                        } else {
                            // the rest are opened in circle view
                            openCircle(navigate, item);
                        }
                    }}
                    cursor="pointer"
                >
                    {item.type === "post" ? item.creator.name : item.name}
                </Text>
                {item.type === "post" && (
                    <>
                        {/* Time since post */}
                        <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                            ·
                        </Text>
                        <Link
                            href={routes.subcircle(item?.parent_circle, item)}
                            onClick={(e) => {
                                e.preventDefault();
                                openSubcircle(navigate, item?.parent_circle, item);
                            }}
                        >
                            <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                                {getPostTime(item)}
                            </Text>
                        </Link>
                        {item.parent_circle && item.parent_circle.id !== circle?.id && (
                            <>
                                <Flex flexDir={"row"} align="center">
                                    <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                                        ·
                                    </Text>
                                    <CirclePicture
                                        circle={item?.parent_circle}
                                        size={16}
                                        hasPopover={true}
                                        marginLeft="7px"
                                    />
                                </Flex>
                            </>
                        )}
                    </>
                )}
                {item.type === "event" && (
                    <>
                        <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                            ·
                        </Text>
                        <Link
                            href={routes.subcircle(item?.parent_circle, item)}
                            onClick={(e) => {
                                e.preventDefault();
                                openSubcircle(navigate, item?.parent_circle, item);
                            }}
                        >
                            <Text
                                fontSize="15px"
                                fontWeight="400"
                                marginLeft="5px"
                                color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                            >
                                {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                            </Text>
                        </Link>
                    </>
                )}
            </HStack>
            <CircleDotsMenu circle={item} position="absolute" top="5px" right="5px" />
        </Flex>
    );
};

export const CircleListItem = ({ item, onClick, inSelect, asCard, isCompact, hasPopover = true, ...props }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);
    const location = useLocationNoUpdates();
    const [showChat, setShowChat] = useState(false);
    const [formattedContent, setFormattedContent] = useState(item?.content);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    useEffect(() => {
        log("CircleListItem.useEffect 1", -1);
    }, []);

    const onChatToggle = (showChat) => {
        setShowChat(showChat);
    };

    if (!item) return null;

    return (
        <CardIf noCard={!asCard} marginBottom={isCompact ? "5px" : "20px"} noBody={true}>
            <Flex
                flexDirection="column"
                key={item.id}
                borderBottom={asCard ? "none" : "1px solid #ebebeb"}
                cursor={inSelect ? "pointer" : "default"}
                onClick={inSelect ? onClick : null}
            >
                <CircleListItemHeader
                    item={item}
                    inSelect={inSelect}
                    onClick={onClick}
                    hasPopover={hasPopover}
                    {...props}
                />

                {!isCompact && (
                    <>
                        <VStack flexGrow="1" align="left" justifyContent="left" spacing="0px" overflow="hidden">
                            {item.content && (
                                <Box
                                    align="left"
                                    overflow="hidden"
                                    maxHeight={isExpanded ? "none" : "150px"}
                                    position="relative"
                                    width="100%"
                                >
                                    <Box
                                        marginLeft={contentMarginPx}
                                        marginRight={contentMarginPx}
                                        position="relative"
                                        maxHeight={isExpanded ? "none" : "150px"}
                                        overflow="hidden"
                                        align="left"
                                    >
                                        <Box marginBottom={isExpanded ? "30px" : "0px"} width="100%" overflow="hidden">
                                            <CircleRichText mentions={item.mentions} mentionsFontSize="15px">
                                                {formattedContent}
                                            </CircleRichText>
                                        </Box>
                                        <Box
                                            position="absolute"
                                            height={isExpanded ? "100%" : "150px"}
                                            bottom="0px"
                                            top="0px"
                                            left="0px"
                                            right="0px"
                                            pointerEvents="none"
                                        >
                                            {!isExpanded && (
                                                <>
                                                    <Box
                                                        position="absolute"
                                                        bottom="20px"
                                                        left="0px"
                                                        right="0px"
                                                        height="50px"
                                                        background="linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))"
                                                    />
                                                    <Box
                                                        position="absolute"
                                                        bottom="0px"
                                                        left="0px"
                                                        right="0px"
                                                        height="20px"
                                                        background="#ffffff"
                                                    />
                                                </>
                                            )}
                                            <Link
                                                onClick={() => setIsExpanded(!isExpanded)}
                                                position="absolute"
                                                bottom="0px"
                                                left="0px"
                                                right="0px"
                                                fontSize="12px"
                                                fontWeight="400"
                                                pointerEvents="auto"
                                                color="#6491ff"
                                            >
                                                {isExpanded ? "Show less" : "Show more"}
                                            </Link>
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {item.type !== "post" && item.description && (
                                <Box paddingBottom="2px" marginLeft={contentMarginPx} marginRight={contentMarginPx}>
                                    <Text fontSize="14px" textAlign="left" style={singleLineEllipsisStyle}>
                                        {item.description}
                                    </Text>
                                </Box>
                            )}

                            {item.media && !isCompact && (
                                <MediaDisplay
                                    media={item.media}
                                    meta_data={item.meta_data}
                                    mentions={item.mentions}
                                    marginTop="10px"
                                />
                            )}

                            {item.type !== "post" && !isCompact && (
                                <CircleCover circle={item} nullIfMissing={true} maxHeight="500px" marginTop="10px" />
                            )}

                            <Box paddingTop="4px" marginLeft={contentMarginPx} marginRight={contentMarginPx}>
                                <CircleTags circle={item} size="tiny" inSelect={inSelect} />
                            </Box>

                            {!inSelect && (item.type === "post" || item.type === "event") && (
                                <>
                                    <Box
                                        paddingTop="2px"
                                        marginLeft={contentMarginPx}
                                        marginRight={contentMarginPx}
                                        marginBottom="5px"
                                    >
                                        <CircleActions circle={item} onChatToggle={onChatToggle} />
                                    </Box>
                                    <Flex marginTop="2px" paddingLeft="10px" paddingRight="10px">
                                        <Divider />
                                    </Flex>
                                    <Comments circle={item} isPreview={false} marginTop="10px" />
                                </>
                            )}
                        </VStack>

                        <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                            {item.type === "event" && (
                                <Flex
                                    borderRadius="20px"
                                    height="18px"
                                    paddingLeft="2px"
                                    paddingRight="5px"
                                    align="center"
                                    flexDirection="row"
                                    justifyContent="center"
                                    onClick={(event) => {
                                        if (inSelect) return;

                                        event.stopPropagation();
                                        setFocusOnMapItem({ item });
                                    }}
                                >
                                    <Icon
                                        width="14px"
                                        height="14px"
                                        color="#929292"
                                        as={HiClock}
                                        cursor="pointer"
                                        marginRight="2px"
                                    />
                                    <Text fontWeight="700" color="#929292" fontSize="12px">
                                        {getEventTime(item)}
                                    </Text>
                                </Flex>
                            )}

                            {item.distance && (
                                <Flex
                                    borderRadius="20px"
                                    height="18px"
                                    //backgroundColor="#c242bb"
                                    backgroundColor="white"
                                    paddingLeft="2px"
                                    paddingRight="5px"
                                    align="center"
                                    flexDirection="row"
                                    justifyContent="center"
                                    onClick={(event) => {
                                        if (inSelect) return;

                                        event.stopPropagation();
                                        setFocusOnMapItem({ item });
                                    }}
                                >
                                    <Icon
                                        width="14px"
                                        height="14px"
                                        color="#929292"
                                        as={RiMapPinFill}
                                        cursor="pointer"
                                        marginRight="2px"
                                    />
                                    <Text fontWeight="700" color="#929292" fontSize="12px">
                                        {getDistanceString(item.distance)}
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    </>
                )}
            </Flex>
        </CardIf>
    );
};

export const CommentButton = ({ circle, onCommentToggle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = 18;
    const iconSizePx = iconSize + "px";
    const [showComments, setShowComments] = useState(false);

    const toggleComments = () => {
        if (!circle?.id) {
            return;
        }

        let newShowComments = !showComments;
        setShowComments(newShowComments);
        onCommentToggle(newShowComments);
    };

    const isAuthorized = () => {
        return circle.is_public || isConnected(userData, circle?.id, ["connected_mutually_to"]);
    };

    return (
        <>
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor="#ffffff"
                _hover={{ backgroundColor: "#f5f5f5", color: "#2596ff" }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleComments}
                cursor="pointer"
                color={showComments ? "#2596ff" : "#333"}
            >
                <Icon
                    width={iconSizePx}
                    height={iconSizePx}
                    as={!isAuthorized() ? BsChat : showComments ? BsChatTextFill : BsChatText}
                />
                {!isAuthorized() && (
                    <Icon position="absolute" width="14px" height="14px" as={BsLockFill} right="4px" bottom="2px" />
                )}
            </Flex>
            {circle?.messages > 0 && (
                <Text fontSize="14px" fontWeight="400" color="#333" marginLeft="5px" marginRight="5px">
                    {circle.messages}
                </Text>
            )}
        </>
    );
};

export const LikeButton = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = isMobile ? 20 : 20;
    const iconSizePx = iconSize + "px";
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [fetchingLikes, setFetchingLikes] = useState(false);
    const [likers, setLikers] = useState([]);

    useEffect(() => {
        if (!userData?.circle_settings) {
            setIsLiked(false);
        } else {
            setIsLiked(userData.circle_settings[circle.id]?.liked);
        }
    }, [circle?.id, userData?.circle_settings]);

    useEffect(() => {
        setLikes(circle?.likes);
    }, [circle?.likes]);

    const toggleLiked = () => {
        if (!circle?.id) {
            return;
        }

        let liked = isLiked;
        if (liked === true) {
            liked = false;
        } else {
            liked = true;
        }
        setIsLiked(liked);
        let currentLikes = likes ? likes : 0;
        setLikes(liked ? currentLikes + 1 : currentLikes - 1);

        // update liked settings
        axios
            .post(`/circles/${user.id}/settings`, {
                circleId: circle.id,
                settings: { liked: liked },
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const fetchAndShowFullLikers = async () => {
        onOpen();
        setFetchingLikes(true);

        // do call using axios to fetch likers
        let likersList = [];
        try {
            const res = await axios.get(`/circles/${circle.id}/likes`);
            likersList = res.data.likes;
        } catch (err) {
            console.error(err);
        }

        setLikers(likersList); // Set full likers list to state
        setFetchingLikes(false);
    };

    // TODO if chat is private and user isn't connected, show a lock icon on the chat button
    // if (!user?.id || !isConnected(userData, circle?.id, ["connected_mutually_to"])) return;

    return (
        <>
            <Flex
                position="relative"
                backgroundColor="#ffffff"
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                cursor="pointer"
                onClick={toggleLiked}
            >
                <Icon
                    as={isLiked ? AiFillHeart : AiOutlineHeart}
                    width="20px"
                    height="20px"
                    color={isLiked ? "#ff4772" : "#333"}
                />
            </Flex>
            {likes > 0 && (
                <Popover trigger="hover" placement="bottom">
                    <PopoverTrigger>
                        <Text
                            fontSize="14px"
                            fontWeight="400"
                            color="#333"
                            marginLeft="5px"
                            onClick={fetchAndShowFullLikers}
                            cursor="pointer"
                        >
                            {likes}
                        </Text>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent bg="#333" border="none" width="auto">
                            <PopoverArrow bg="#333" border="none" />
                            <PopoverBody>
                                <Flex flexDirection="column">
                                    <Text fontSize="14px" fontWeight="700" color="white">
                                        Likes
                                    </Text>
                                    {circle.like_preview_list?.map((liker, index) => (
                                        <Text key={index} fontSize="12px" color="white">
                                            {liker.name}
                                        </Text>
                                    ))}
                                    {circle.like_preview_list?.length < circle?.likes && (
                                        <Text fontSize="12px" color="white">
                                            and {circle?.likes - circle.like_preview_list?.length} more ...
                                        </Text>
                                    )}
                                </Flex>
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            )}

            {/* Modal for full likers list */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Likes</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex flexDirection="column" marginBottom="20px">
                            {fetchingLikes && <Spinner />}
                            {!fetchingLikes && (
                                <>
                                    {likers?.map((liker, index) => (
                                        <CircleListItem
                                            key={liker.id}
                                            item={liker}
                                            asCard={false}
                                            isCompact={true}
                                            hasPopover={false}
                                        />
                                    ))}
                                </>
                            )}
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export const CommentsButton = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const [comments, setComments] = useState(0);

    useEffect(() => {
        setComments(circle?.comments);
    }, [circle?.comments]);

    const openComments = () => {
        // open comments
    };

    return (
        <>
            <Flex
                position="relative"
                backgroundColor="#ffffff"
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                cursor="pointer"
                onClick={openComments}
            >
                <Icon as={BsChat} width="16px" height="16px" marginBottom="2px" color={"#333"} />
            </Flex>
            {comments > 0 && (
                <Popover trigger="hover" placement="bottom">
                    <PopoverTrigger>
                        <Text
                            fontSize="14px"
                            fontWeight="400"
                            color="#333"
                            marginLeft="5px"
                            onClick={openComments}
                            cursor="pointer"
                        >
                            {comments}
                        </Text>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent bg="#333" border="none" width="auto">
                            <PopoverArrow bg="#333" border="none" />
                            <PopoverBody>
                                <Flex flexDirection="column">
                                    <Text fontSize="14px" fontWeight="700" color="white">
                                        Comments
                                    </Text>
                                    {circle.commenters_preview_list?.map((commenter, index) => (
                                        <Text key={index} fontSize="12px" color="white">
                                            {commenter.name}
                                        </Text>
                                    ))}
                                    {circle.commenters_preview_list?.length < circle?.comments && (
                                        <Text fontSize="12px" color="white">
                                            and {circle?.comments - circle.commenters_preview_list?.length} more ...
                                        </Text>
                                    )}
                                </Flex>
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            )}
        </>
    );
};

export const CircleActions = ({ circle, onCommentToggle, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);

    if (!circle) return null;

    return (
        <Flex position="relative" align="center" flexDirection="row">
            <LikeButton circle={circle} />
            <Box flexGrow="1"></Box>
            <CommentsButton circle={circle} />
            {/* <ShareButtonMenu /> */}
            {/* <FavoriteButton />
            {isConnected(userData, circle.id, ["connected_mutually_to"]) && <NotificationsBell />}
            <ConnectButton circle={circle} hoverFadeColor="#ffffff" /> */}
        </Flex>
    );
};

export default CircleListItem;
