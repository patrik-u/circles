//#region imports
import React, { useEffect, useState } from "react";
import { log } from "@/components/Helpers";
import db from "@/components/Firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";
import CircleExtrasAndMain from "@/components/CircleExtrasAndMain";
import CirclePostMain from "@/components/CirclePostMain";
import CircleAbout from "./CircleAbout";
//#endregion

// displays one circle post
const CirclePost = () => {
    log("CirclePost.render", -1);

    const { postId } = useParams();
    const [post, setPost] = useState(null);

    // subscribes to post circle
    useEffect(() => {
        log("CirclePost.useEffect", -1);
        if (!postId) return;

        // subscribe to post circle
        let unsubscribeGetCircle = onSnapshot(doc(db, "circles", postId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists || !newCircle) {
                return;
            }
            newCircle.id = doc.id;
            setPost(newCircle);
        });
        return () => {
            if (unsubscribeGetCircle) unsubscribeGetCircle();
        };
    }, [postId, setPost]);

    if (!post) return null;

    return (
        <CircleExtrasAndMain
            main={<CirclePostMain post={post} />}
            extras={<CircleAbout />}
            switchWhenExpanded={true}
            hideExtrasWhenCompact={true}
        />
    );
};

export default CirclePost;
