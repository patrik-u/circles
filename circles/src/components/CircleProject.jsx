//#region imports
import React, { useEffect, useState } from "react";
import { log } from "@/components/Helpers";
import db from "@/components/Firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";
import CircleExtrasAndMain from "@/components/CircleExtrasAndMain";
import CircleProjectMain from "@/components/CircleProjectMain";
import CircleProjectSidePanel from "@/components/CircleProjectSidePanel";
//#endregion

const CircleProject = () => {
    log("CircleProject.render", -1);

    const { projectId } = useParams();
    const [project, setProject] = useState(null);

    // subscribes to project circle
    useEffect(() => {
        log("CircleProject.useEffect", -1);
        if (!projectId) return;

        // subscribe to project circle
        let unsubscribeGetCircle = onSnapshot(doc(db, "circles", projectId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists || !newCircle) {
                return;
            }
            newCircle.id = doc.id;
            setProject(newCircle);
        });
        return () => {
            if (unsubscribeGetCircle) unsubscribeGetCircle();
        };
    }, [projectId, setProject]);

    if (!project) return null;

    return (
        <CircleExtrasAndMain
            main={<CircleProjectSidePanel project={project} />}
            extras={<CircleProjectMain project={project} />}
            hideExtrasWhenCompact={true}
        />
    );
};

export default CircleProject;
