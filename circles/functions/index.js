//#region imports and constants
const { getLinkPreview, getPreviewFromContent } = require("link-preview-js");
const functions = require("firebase-functions");
//const { defineInt, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { GoogleSpreadsheet } = require("google-spreadsheet");
const fs = require("fs");
const createDOMPurify = require("dompurify");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
const linkify = require("linkifyjs");
const linkifyHtml = require("linkify-html");
const crypto = require("crypto");

admin.initializeApp();

const express = require("express");
const cors = require("cors");

const { request } = require("express");
const { firebaseConfig } = require("firebase-functions");
const { user } = require("firebase-functions/v1/auth");

const app = express();

app.use(cors());

const db = admin.firestore();

const nodemailer = require("nodemailer");
const postmarkTransport = require("nodemailer-postmark-transport");

// const postmarkKey = defineString("POSTMARK_API_KEY");
// const mailTransport = nodemailer.createTransport(
//     postmarkTransport({
//         auth: {
//             apiKey: postmarkKey,
//         },
//     })
// );

// const Handlebars = require("handlebars");

const path = require("path");
const { I18n } = require("i18n");
const i18n = new I18n({
    defaultLocale: "en",
    locales: ["en", "sv"],
    directory: path.join(__dirname, "locales"),
});

//#endregion

//#region auth

// authorize user
const auth = async (req, res, next) => {
    if ((!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) && !(req.cookies && req.cookies.__session)) {
        functions.logger.error(
            "No Firebase ID token was passed as a Bearer token in the Authorization header.",
            "Make sure you authorize your request by providing the following HTTP header:",
            "Authorization: Bearer <Firebase ID Token>",
            'or by passing a "__session" cookie.'
        );
        res.status(403).send("unauthorized");
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        // read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
        // read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // no cookie
        functions.logger.error("Unauthorized request made");
        res.status(403).send("unauthorized");
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        functions.logger.error("Error while verifying Firebase ID token:", error);
        res.status(403).send("unauthorized");
        return;
    }
};

// authorize user and decode token if available but let unautherized users through
const noAuth = async (req, res, next) => {
    if ((!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) && !(req.cookies && req.cookies.__session)) {
        next();
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        // read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
        // read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // no cookie
        next();
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        next();
        return;
    }
};

//#endregion

//#region helper functions

const getCircle = async (circleId) => {
    let circleDoc = await db.collection("circles").doc(circleId).get();
    if (!circleDoc.exists) return null;
    return { id: circleId, ...circleDoc.data() };
};

const getCircleData = async (circleId) => {
    const circleDataRef = db.collection("circle_data");
    const circleDataSnapshot = await circleDataRef.where("circle_id", "==", circleId).get();
    if (circleDataSnapshot.docs.length <= 0) return null;
    const userDetailDocId = circleDataSnapshot.docs[0].id;
    return { id: userDetailDocId, ...circleDataSnapshot.docs[0].data() };
};

const getAdminConnections = async (id) => {
    let query = db.collection("connections").where("source.id", "==", id).where("type", "in", ["owned_by", "admin_by"]);
    let result = await query.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const getMemberConnections = async (id) => {
    let query = db.collection("connections").where("source.id", "==", id).where("type", "==", "connected_mutually_to");
    let result = await query.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const getConnections = async (id, match = "source") => {
    let connectionsRef = db.collection("connections");
    let snapshot = null;
    switch (match) {
        default:
        case "source":
            snapshot = connectionsRef.where("source.id", "==", id);
            break;
        case "target":
            snapshot = connectionsRef.where("target.id", "==", id);
            break;
        case "any":
            snapshot = connectionsRef.where("circle_ids", "array-contains", id);
            break;
    }
    let result = await snapshot.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const getAllConnections = async (sourceId, targetId, type = null) => {
    let connectionsRef = db.collection("connections");
    let snapshot = null;
    snapshot = connectionsRef.where("source.id", "==", sourceId).where("target.id", "==", targetId);
    if (type !== null) {
        snapshot = snapshot.where("type", "==", type);
    }
    let result = await snapshot.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const getConnection = async (sourceId, targetId, type) => {
    let connectionsRef = db.collection("connections").where("source.id", "==", sourceId).where("target.id", "==", targetId).where("type", "==", type);
    let connectionsSnapshot = await connectionsRef.get();
    if (connectionsSnapshot.docs.length <= 0) return null;
    const connectionDocId = connectionsSnapshot.docs[0].id;
    return { id: connectionDocId, ...connectionsSnapshot.docs[0].data() };
};

const getConnectionById = async (connectionId) => {
    let connectionDoc = await db.collection("connections").doc(connectionId).get();
    if (!connectionDoc.exists) return null;
    return { id: connectionId, ...connectionDoc.data() };
};

const getConfig = async () => {
    let configDoc = await db.collection("config").doc("config").get();
    if (!configDoc.exists) return null;
    return configDoc.data();
};

const isSuperAdmin = async (authCallerId) => {
    let config = await getConfig();
    return config.admins.includes(authCallerId);
};

const getChatMessage = async (messageId) => {
    let messageDoc = await db.collection("chat_messages").doc(messageId).get();
    if (!messageDoc.exists) return null;
    return { id: messageId, ...messageDoc.data() };
};

const getCircleTypes = (source, target) => {
    if (!source || !target) return "";
    const types = [source.type, target.type];
    return types.sort().join("_");
};

// updates circle data
const updateCircle = async (id, circle) => {
    const circleRef = db.collection("circles").doc(id);
    let circleDoc = await circleRef.get();
    if (!circleDoc.exists) {
        return null;
    }

    delete circle.id;

    // update circle
    await circleRef.set(circle, {
        merge: true,
    });

    circle.id = id;

    circleDoc = await circleRef.get();
    let circleData = circleDoc?.data();
    if (!circleData) return;

    const connectionDocs = await db.collection("connections").where("circle_ids", "array-contains", id).get();
    circleData.id = circleDoc.id;

    // workaround for firestore limit of 500 writes per batch
    let batchArray = [db.batch()];
    let operationCounter = 0;
    let batchIndex = 0;

    // loop through connections and update them
    for (var i = 0; i < connectionDocs.docs.length; ++i) {
        let connection = connectionDocs.docs[i].data();
        let connectionRef = db.collection("connections").doc(connectionDocs.docs[i].id);

        if (connection.source.id === id) {
            batchArray[batchIndex].set(connectionRef, { source: circleData }, { merge: true });
        } else if (connection.target.id === id) {
            batchArray[batchIndex].set(connectionRef, { target: circleData }, { merge: true });
        }
        ++operationCounter;
        if (operationCounter >= 499) {
            batchArray.push(db.batch());
            ++batchIndex;
            operationCounter = 0;
        }
    }

    batchArray.forEach(async (batch) => await batch.commit());
    return circleData;
};

// updates chat message
const updateChatMessage = async (id, chatMessage) => {
    const messageRef = db.collection("chat_messages").doc(id);
    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
        return null;
    }

    delete chatMessage.id;

    // update circle
    await messageRef.set(chatMessage, {
        merge: true,
    });

    // TODO update replies to message
};

// deletes circle
const deleteCircle = async (id) => {
    const circleRef = db.collection("circles").doc(id);

    // delete circle
    await circleRef.delete();

    // delete circle_data
    let circleData = await getCircleData(id);
    if (circleData) {
        const circleDataRef = db.collection("circle_data").doc(circleData.id);
        await circleDataRef.delete();
    }

    // delete connections
    const connectionsSnapshot = await db.collection("connections").where("circle_ids", "array-contains", id).get();
    connectionsSnapshot.forEach(async (connectionDoc) => {
        const docRef = db.collection("connections").doc(connectionDoc.id);
        await docRef.delete();
    });
};

// deletes chat message
const deleteChatMessage = async (id) => {
    const messageRef = db.collection("chat_messages").doc(id);

    // delete chat message
    await messageRef.delete();

    // TODO delete all that replies to the message
};

const getNewUserData = (id, email, date) => {
    return {
        circle_id: id,
        email: email,
        created_at: date,
    };
};

const getCallerIp = (req) => {
    let callerIp = null;
    if (req.headers["fastly-client-ip"]) {
        callerIp = req.headers["fastly-client-ip"];
    } else if (req.headers["x-forwarded-for"]) {
        callerIp = req.headers["x-forwarded-for"];
    } else if (req.headers["x-appengine-user-ip"]) {
        callerIp = req.headers["x-appengine-user-ip"];
    } else if (req.socket.remoteAddress) {
        callerIp = req.socket.remoteAddress;
    }
    return callerIp;
};

// creates connection between two circles
const createConnection = async (source, target, type, notify, authCallerId, propagateChanges = true) => {
    let created_at = new Date();
    if (typeof source === "string") {
        source = await getCircle(source);
    }
    if (typeof target === "string") {
        target = await getCircle(target);
    }

    // don't create connections to self
    if (!source || !target || source.id === target.id) return;

    // verify connection doesn't already exist
    let connection = await getConnection(source.id, target.id, type);
    if (connection) return;

    const connectionRef = db.collection("connections").doc();
    await connectionRef.set({ source, target, type, circle_ids: [source.id, target.id], circle_types: getCircleTypes(source, target), created_at });

    // update target circle connection count
    let updatedCircle = {
        connections: admin.firestore.FieldValue.increment(1),
    };

    if (
        source.id === "earth" ||
        target.id === "earth" ||
        source.type === "tag" ||
        target.type === "tag" ||
        type === "connected_mutually_to_request" ||
        type === "connected_to" ||
        !propagateChanges
    ) {
        // for performance reasons we don't propagate changes if:
        // earth circle is connected
        // tags are connected
        // on connection requests or follow
        // when new circle is created (propagateChanges is false)
        const circleRef = db.collection("circles").doc(target.id);
        await circleRef.update(updatedCircle);
    } else {
        // update circle and propagate changes
        updatedCircle.updates = {};
        updatedCircle.updates[`${source.type}s`] = created_at;
        updatedCircle.updates.any = created_at;
        await updateCircle(target.id, updatedCircle);
    }

    // CONNECT123 here we might want to update latest_connections as well

    if (notify) {
        const connection_id = connectionRef.id;

        // send notification to admins of target circle that a new connection has been made
        let adminConnections = await getAdminConnections(target.id);
        for (var adminConnection of adminConnections) {
            if (adminConnection.target.id === authCallerId) {
                // ignore notifying admin if it's the user creating the connection
                continue;
            }
            await sendConnectNotification(adminConnection.target.id, source, target, type, connection_id);
        }
        // send notification to user that connection has been made
        if (target.type === "user") {
            // notify if it's not the user creating the connection
            if (target.id !== authCallerId) {
                await sendConnectNotification(target.id, source, target, type, connection_id);
            }
        }
    }

    if (type === "connected_mutually_to") {
        // add target circle to source circle's list of mutual connections
        const circleDataRef = db.collection("circle_data").doc(source.id);
        await circleDataRef.set({ mutual_connections: admin.firestore.FieldValue.arrayUnion(target.id) }, { merge: true });
    }
};

// deletes connection between two circles
const deleteConnection = async (source, target, type) => {
    if (typeof source === "string") {
        source = await getCircle(source);
    }
    if (typeof target === "string") {
        target = await getCircle(target);
    }

    // see if connection exists
    let connection = await getConnection(source.id, target.id, type);
    if (!connection) return;
    await deleteConnectionByObject(connection);
};

const deleteConnectionByObject = async (connection, updateNotifications = true) => {
    const connectionRef = db.collection("connections").doc(connection.id);
    await connectionRef.delete();

    // update target circle connection count
    const circleRef = db.collection("circles").doc(connection.target.id);
    await circleRef.update({
        connections: admin.firestore.FieldValue.increment(-1),
    });

    // update any notifications around the request
    if (connection.type === "connected_mutually_to_request" && updateNotifications) {
        let date = new Date();
        // update notifications
        const notificationsDocs = await db.collection("notifications").where("connection_id", "==", connection.id).get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({ request_status: "denied", request_updated_at: date });
        });
    }

    if (connection.type === "connected_mutually_to") {
        // remove target circle from source circle's list of mutual connections
        const circleDataRef = db.collection("circle_data").doc(connection.source.id);
        await circleDataRef.update({ mutual_connections: admin.firestore.FieldValue.arrayRemove(connection.target.id) });
    }

    // CONNECT123 here we might want to update latest_connections as well
};

// sends notification to user about a new connection made
const sendConnectNotification = async (userId, source, target, type, connection_id) => {
    const notificationsRes = db.collection("notifications").doc();
    const date = new Date();
    const newNotification = {
        user_id: userId,
        date: date,
        type: "connection",
        source: source,
        target: target,
        is_read: false,
        connection_type: type,
        connection_id,
    };
    await notificationsRes.set(newNotification);
};

const getUserCircleSettings = async (userId, circleId) => {
    let data = await getCircleData(userId);
    return data?.circle_settings?.[circleId];
};

const sendMessageNotification = async (userId, circle, message) => {
    // const newMessage = {
    //     circle_id: circleId,
    //     user,
    //     sent_at: date,
    //     message: message,
    // };

    // chat notification looks like this:
    //"[circle] Tim: Hey blah blah..." (number of unread messages)

    let notificationRef = null;
    const notificationsSnapshot = await db.collection("chat_notifications").where("user_id", "==", userId).where("circle_id", "==", message.circle_id).get();
    if (notificationsSnapshot.docs.length <= 0) {
        notificationRef = db.collection("chat_notifications").doc();
    } else {
        notificationRef = db.collection("chat_notifications").doc(notificationsSnapshot.docs[0].id);
    }

    const date = new Date();
    const newNotification = {
        user_id: userId,
        circle_id: message.circle_id,
        circle: circle,
        date: date,
        unread_messages: admin.firestore.FieldValue.increment(1),
        is_seen: false,
        last_message: message,
    };

    let circleSettings = await getUserCircleSettings(userId, message.circle_id);
    if (circleSettings?.notifications === "off") {
        newNotification.unread_messages = 0;
        newNotification.is_seen = true;
        delete newNotification.date;
    }

    await notificationRef.set(newNotification, { merge: true });
};

// returns true if source is administrator of target
const isAdminOf = async (sourceId, targetId) => {
    if (sourceId === targetId) return true;
    let ownedBy = await getConnection(targetId, sourceId, "owned_by");
    let adminBy = await getConnection(targetId, sourceId, "admin_by");
    return ownedBy || adminBy;
};

// returns true if source is owner of target
const isOwnerOf = async (sourceId, targetId) => {
    let ownedBy = await getConnection(targetId, sourceId, "owned_by");
    return ownedBy;
};

const addTag = async (circle, tag) => {
    if (circle?.tags?.some((x) => x.id === tag.id)) {
        return;
    }
    const circleRef = db.collection("circles").doc(circle.id);
    await circleRef.update({
        tags: admin.firestore.FieldValue.arrayUnion(tag),
    });
};

const deleteTag = async (circle, tag) => {
    let circleTag = circle?.tags?.find((x) => x.id === tag.id);
    if (!circleTag) {
        return;
    }
    const circleRef = db.collection("circles").doc(circle.id);
    await circleRef.update({
        tags: admin.firestore.FieldValue.arrayRemove(circleTag),
    });
};

const updateTags = async (source, target, operation) => {
    if (typeof source === "string") {
        source = await getCircle(source);
    }
    if (typeof target === "string") {
        target = await getCircle(target);
    }

    if (operation === "add") {
        if (target?.type === "tag") {
            // add tag to source
            await addTag(source, target);
        }
        if (source?.type === "tag") {
            // add tag to target
            await addTag(target, source);
        }
    }
    if (operation === "delete") {
        if (target?.type === "tag") {
            // delete tag from source
            await deleteTag(source, target);
        }
        if (source?.type === "tag") {
            // delete tag from target
            await deleteTag(target, source);
        }
    }
};

//#endregion

//#region circles
// get all circles
app.get("/circles", auth, (req, res) => {
    db.collection("circles")
        .get()
        .then((data) => {
            let circles = [];
            data.forEach((doc) => {
                circles.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            return res.json(circles);
        })
        .catch((error) => {
            console.error(error);
            return res.json({ error: error });
        });
});

// create circle
app.post("/circles", auth, async (req, res) => {
    const authCallerId = req.user.user_id;

    // validate request
    let errors = {};
    if (!req.body.name || req.body.name.length > 50) {
        errors.name = "Name must be between 1 and 50 characters";
    }
    if (req.body.type !== "circle" && req.body.type !== "event" && req.body.type !== "tag" && req.body.type !== "room" && req.body.type !== "link") {
        errors.type = "Invalid circle type";
    }

    let description = req.body.description;
    if (req.body.type === "circle" || req.body.type === "tag" || req.body.type === "room" || req.body.type === "link") {
        if (req.body.description && req.body.description > 200) {
            errors.description = "Description needs to be between 0 and 200 characters";
        }
    } else if (req.body.type === "event") {
        if (!req.body.content || req.body.content > 10000) {
            errors.content = "Event content needs to be between 0 and 10000 characters";
        } else {
            description = req.body.content.substring(0, 150);
            if (description.length >= 150) {
                description += "...";
            }
        }
    }

    // verify user is admin of parent circle
    let parentId = req.body.parentCircle?.id;
    if (parentId) {
        // check if user is owner or admin and allowed to set circle parent
        const isAuthorized = await isAdminOf(authCallerId, parentId);
        if (!isAuthorized) {
            errors.parentCircle = "User is not authorized to set parent circle";
        }
    }

    if (Object.keys(errors).length !== 0) {
        return res.json(errors);
    }

    try {
        const date = new Date();
        const batch = db.batch();
        const circleRes = db.collection("circles").doc();
        let user = await getCircle(authCallerId);

        if (req.body.type === "tag") {
            // only super admins can create tags currently
            let isAuthorized = await isSuperAdmin(authCallerId);
            if (!isAuthorized) {
                return res.status(403).json({ error: "unauthorized" });
            }
        }

        // create circle
        const newCircle = {
            name: req.body.name,
            description: description,
            language: req.body.language,
            created_by: authCallerId,
            created_at: date,
            type: req.body.type,
            chat_is_public: req.body.chatIsPublic === true,
        };

        let parent = null;
        if (parentId) {
            parent = await getCircle(parentId);
            newCircle.parent_circle = parent;
        }

        if (req.body.type === "event") {
            newCircle.content = req.body.content;
            newCircle.time = req.body.time;
            newCircle.starts_at = new Date(req.body.startsAt);
            newCircle.is_all_day = req.body.isAllDay;
        } else if (req.body.type === "tag") {
            newCircle.text = "#" + newCircle.name;
        }

        batch.set(circleRes, newCircle);

        // add create circle activity
        const newActivity = {
            user,
            circle: { id: circleRes.id, ...newCircle },
            date: date,
            activity: "create_circle",
        };

        const activityRes = db.collection("activities").doc();
        batch.set(activityRes, newActivity);
        await batch.commit();

        // add connections to circle
        let circle = await getCircle(circleRes.id);
        let earth = await getCircle("earth");
        await createConnection(user, circle, "owner_of", false, null, false);
        await createConnection(circle, user, "owned_by", false, null, false);
        await createConnection(user, circle, "creator_of", false, null, false);
        await createConnection(circle, user, "created_by", false, null, false);
        await createConnection(user, circle, "connected_to", false, null, false);
        await createConnection(circle, earth, "connected_to", false, null, false);

        if (circle.type !== "tag") {
            await createConnection(user, circle, "connected_mutually_to", false, null, false);
            await createConnection(circle, user, "connected_mutually_to", false, null, false);
        }
        await createConnection(circle, earth, "connected_mutually_to", false, null, false);
        await createConnection(earth, circle, "connected_mutually_to", false, null, false);

        if (parent) {
            await createConnection(parent, circle, "parent_of", false, null, false);
            await createConnection(circle, parent, "parented_by", false, null, false);
        }

        return res.json({ message: "Circle created", circle: { id: circleRes.id, ...newCircle } });
    } catch (error) {
        functions.logger.error("Error while creating circle:", error);
        return res.json({ error: error });
    }
});

// update circle
app.put("/circles/:id", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;

    try {
        const circleRef = db.collection("circles").doc(circleId);
        const doc = await circleRef.get();
        if (!doc.exists) {
            return res.json({ error: "circle not found" });
        }
        let circle = { id: doc.id, ...doc.data() };
        let type = circle.type;

        // check if user is owner or admin and allowed to update circle data
        const isAuthorized = await isAdminOf(authCallerId, circleId);
        if (!isAuthorized) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // TODO validate input
        // update circle data, for now just update cover and logo image
        var circleData = {};
        let errors = {};
        if (req.body.circleData?.cover) {
            circleData.cover = req.body.circleData.cover;
        }
        if (req.body.circleData?.picture) {
            circleData.picture = req.body.circleData.picture;
        }
        if (req.body.circleData?.base) {
            circleData.base = req.body.circleData.base;
        }
        if (req.body.circleData?.name) {
            circleData.name = req.body.circleData.name;
        }
        if (req.body.circleData?.description) {
            circleData.description = req.body.circleData.description;
        }
        if (req.body.circleData?.content) {
            if (type === "event") {
                circleData.content = req.body.circleData.content;
                let description = circleData.content.substring(0, 150);
                if (description.length >= 150) {
                    description += "...";
                }
                circleData.description = description;
            } else {
                circleData.content = req.body.circleData.content;
            }
        }
        if (req.body.circleData?.language) {
            circleData.language = req.body.circleData.language;
        }
        if (req.body.circleData?.social_media) {
            circleData.social_media = req.body.circleData.social_media;
        }
        if (req.body.circleData?.tags) {
            if (!Array.isArray(req.body.circleData.tags)) {
                errors.tags = "Invalid tags data";
            }
            // TODO validate tags data
            circleData.tags = req.body.circleData.tags;
        }
        if (req.body.circleData?.questions) {
            // TODO validate questions data
            circleData.questions = req.body.circleData.questions;
            if (circleData.questions.question0?.to_delete) {
                circleData.questions.question0 = admin.firestore.FieldValue.delete();
            }
            if (circleData.questions.question1?.to_delete) {
                circleData.questions.question1 = admin.firestore.FieldValue.delete();
            }
            if (circleData.questions.question2?.to_delete) {
                circleData.questions.question2 = admin.firestore.FieldValue.delete();
            }
        }

        if (type === "event") {
            if (req.body.circleData?.startsAt) {
                circleData.starts_at = new Date(req.body.circleData.startsAt);
            }
            if (req.body.circleData?.isAllDay) {
                circleData.is_all_day = req.body.circleData.isAllDay;
            }
            if (req.body.circleData?.time) {
                circleData.time = req.body.circleData.time;
            }
        }

        if (req.body.circleData?.chatIsPublic !== undefined) {
            circleData.chat_is_public = req.body.circleData?.chatIsPublic === true;
        }

        // verify user is admin of parent circle
        let parent = null;
        let oldParentId = circle.parent_circle?.id;
        let parentId = req.body.circleData.parentCircle?.id;
        if (parentId !== oldParentId) {
            if (parentId) {
                // check if user is owner or admin and allowed to set circle parent
                const isAuthorized = await isAdminOf(authCallerId, parentId);
                if (!isAuthorized) {
                    errors.parentCircle = "User is not authorized to set parent circle";
                }
                parent = await getCircle(parentId);
            }
            circleData.parent_circle = parent ?? {};
        }

        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }

        if (Object.keys(circleData).length > 0) {
            // update circle
            await updateCircle(circleId, circleData);

            // update connection to parent if changed
            if (parentId !== oldParentId) {
                circle = await getCircle(circleId);
                if (oldParentId) {
                    let oldParent = await getCircle(oldParentId);
                    await deleteConnection(oldParent, circle, "parent_of");
                    await deleteConnection(circle, oldParent, "parented_by");
                }

                // add new parent
                if (parent) {
                    await createConnection(parent, circle, "parent_of", false, null, false);
                    await createConnection(circle, parent, "parented_by", false, null, false);
                }
            }

            // update connection to tags
            if (circleData.tags) {
                // clear all connections to previous tags
                if (circle.tags) {
                    for (const tag of circle.tags) {
                        if (tag.is_custom) {
                            // ignore custom tags
                            continue;
                        }
                        let connectionsCircleToTag = await getAllConnections(circleId, tag.id, "connected_mutually_to");
                        if (connectionsCircleToTag) {
                            for (const connection of connectionsCircleToTag) {
                                await deleteConnection(connection.source, connection.target, "connected_mutually_to");
                            }
                        }
                        let connectionsTagToCircle = await getAllConnections(tag.id, circleId, "connected_mutually_to");
                        if (connectionsTagToCircle) {
                            for (const connection of connectionsTagToCircle) {
                                await deleteConnection(connection.source, connection.target, "connected_mutually_to");
                            }
                        }
                    }
                }

                // add connections to new tags
                for (const tag of circleData.tags) {
                    if (tag.is_custom) {
                        // ignore custom tags
                        continue;
                    }
                    await createConnection(circleId, tag.id, "connected_mutually_to", true, authCallerId); // TODO we might not want to notify owner/admins of tags when someone connects to it
                    await createConnection(tag.id, circleId, "connected_mutually_to");
                }
            }
        }

        if (req.body.circlePrivateData) {
            // TODO validate input
            let circlePrivateData = {};
            if (req.body.circlePrivateData.email) {
                circlePrivateData.email = req.body.circlePrivateData.email;
            }
            if (req.body.circlePrivateData.agreed_to_tnc) {
                circlePrivateData.agreed_to_tnc = new Date();
            }
            if (req.body.circlePrivateData.agreed_to_email_updates) {
                circlePrivateData.agreed_to_email_updates = req.body.circlePrivateData.agreed_to_email_updates;
            }
            if (req.body.circlePrivateData.completed_guide) {
                circlePrivateData.completed_guide = new Date();
            }

            if (Object.keys(circlePrivateData).length > 0) {
                const circleDataRef = db.collection("circle_data");
                const circleDataSnapshot = await circleDataRef.where("circle_id", "==", circleId).get();
                let circleDataDocId = null;
                if (circleDataSnapshot.docs.length <= 0) {
                    circleDataDocId = circleDataRef.doc().id;
                    circlePrivateData.circle_id = circleId;
                } else {
                    circleDataDocId = circleDataSnapshot.docs[0].id;
                }
                await circleDataRef.doc(circleDataDocId).set(circlePrivateData, { merge: true });
            }
        }

        return res.json({ message: "circle updated" });
    } catch (error) {
        functions.logger.error("Error while updating circle data:", error);
        return res.json({ error: error });
    }
});

// delete circle
app.delete("/circles/:id", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;
    const name_confirmation = req.body.name_confirmation;

    try {
        const circle = await getCircle(circleId);
        if (!circle) {
            return res.json({ error: "circle not found" });
        }

        // check if user is owner or admin and allowed to update circle data
        const isAuthorized = await isOwnerOf(authCallerId, circleId);
        if (!isAuthorized) {
            return res.json({ error: "circle can only be deleted by owner" });
        }

        if (circle.name !== name_confirmation) {
            return res.json({ error: "invalid name confirmation" });
        }

        // delete circle
        await deleteCircle(circleId);

        return res.json({ message: "circle deleted" });
    } catch (error) {
        functions.logger.error("Error while updating circle data:", error);
        return res.json({ error: error });
    }
});

// create connection
app.post("/circles/:id/connections", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const sourceId = req.params.id;
    const targetId = req.body.targetId;
    const type = req.body.type;
    const alwaysNotify = req.body.alwaysNotify;

    // validate input
    if (!sourceId) {
        return res.json({ error: "invalid source" });
    }
    if (!targetId) {
        return res.json({ error: "invalid target" });
    }
    if (sourceId === targetId) {
        return res.json({ error: "source and target can't be the same" });
    }
    if (type !== "connected_to" && type !== "connected_mutually_to" && type !== "admin_by") {
        return res.json({ error: "invalid connection type" });
    }

    // make sure user is either the source or admin/owner of source
    let isAuthorized = false;
    if (authCallerId === sourceId) {
        isAuthorized = true;
    } else {
        isAuthorized = await isAdminOf(authCallerId, sourceId);
    }

    if (!isAuthorized) {
        return res.status(403).json({ error: "unauthorized" });
    }

    try {
        if (type === "connected_to") {
            // follow
            await createConnection(sourceId, targetId, "connected_to", true, authCallerId);
        } else if (type === "connected_mutually_to") {
            // see if there is a mutual connection request from target to user
            let connection = await getConnection(targetId, sourceId, "connected_mutually_to_request");
            if (connection) {
                await createConnection(sourceId, targetId, "connected_mutually_to", true, authCallerId);
                await createConnection(targetId, sourceId, "connected_mutually_to", alwaysNotify);
                await deleteConnection(targetId, sourceId, "connected_mutually_to_request");
                await updateTags(connection.source, connection.target, "add");
                return res.json({ auto_approved: true });
            }

            // see if user is admin of target then auto-approve
            let isAdminOfTarget = await isAdminOf(authCallerId, targetId);
            if (isAdminOfTarget) {
                await createConnection(sourceId, targetId, "connected_mutually_to", true, authCallerId);
                await createConnection(targetId, sourceId, "connected_mutually_to", alwaysNotify);
                await updateTags(sourceId, targetId, "add");
                return res.json({ auto_approved: true });
            } else {
                // see if target circle needs approval to join
                let targetCircleData = await getCircleData(targetId);
                let targetCircle = await getCircle(targetId);

                // TODO for now auto approve event, link and tag connections
                if (
                    targetCircleData?.auto_approve_connections ||
                    targetCircle?.type === "event" ||
                    targetCircle?.type === "tag" ||
                    targetCircle?.type === "link"
                ) {
                    await createConnection(sourceId, targetId, "connected_mutually_to", true, authCallerId);
                    await createConnection(targetId, sourceId, "connected_mutually_to");
                    await updateTags(sourceId, targetId, "add");

                    return res.json({ auto_approved: true });
                } else {
                    // create connection request
                    await createConnection(sourceId, targetId, "connected_mutually_to_request", true, authCallerId);
                }
            }
        } else if (type === "admin_by") {
            let connection = await getConnection(sourceId, targetId, "admin_by");
            if (connection) {
                // user already admin
                return res.json({ auto_approved: true });
            }
            // create admin connection request
            await createConnection(sourceId, targetId, "admin_by_request", true, authCallerId);
        }
        return res.json({ message: "Request sent" });
    } catch (error) {
        functions.logger.error("Error while creating connection:", error);
        return res.json({ error: error });
    }
});

// delete connection
app.delete("/circles/:id/connections", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const sourceId = req.params.id;
    const targetId = req.body.targetId;
    const type = req.body.type;

    // validate input
    if (!sourceId) {
        return res.json({ error: "invalid source" });
    }
    if (!targetId) {
        return res.json({ error: "invalid target" });
    }
    if (sourceId === targetId) {
        return res.json({ error: "source and target can't be the same" });
    }
    if (type !== "connected_to" && type !== "connected_mutually_to" && type !== "connected_mutually_to_request" && type !== "admin_by_request") {
        return res.json({ error: "invalid connection type" });
    }

    // make sure user is either the source or admin/owner of source
    let isAuthorized = false;
    if (authCallerId === sourceId) {
        isAuthorized = true;
    } else {
        isAuthorized = await isAdminOf(authCallerId, sourceId);
    }

    if (!isAuthorized) {
        return res.status(403).json({ error: "unauthorized" });
    }

    try {
        if (type === "connected_to" || type === "connected_mutually_to_request" || type === "admin_by_request") {
            // unfollow / delete request
            await deleteConnection(sourceId, targetId, type);
        } else if (type === "connected_mutually_to") {
            // delete connection both ways
            await deleteConnection(sourceId, targetId, "connected_mutually_to");
            await deleteConnection(targetId, sourceId, "connected_mutually_to");

            // update tags
            await updateTags(sourceId, targetId, "delete");
        }

        return res.json({ message: "Connection removed" });
    } catch (error) {
        functions.logger.error("Error while deleting connection:", error);
        return res.json({ error: error });
    }
});

// approve connection request
app.post("/connections/:id/approve", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const connectionId = req.params.id;
    const date = new Date();

    try {
        let connection = await getConnectionById(connectionId);
        if (!connection || (connection.type !== "connected_mutually_to_request" && connection.type !== "admin_by_request")) {
            return res.json({ error: "connection-request-not-found" });
        }

        // verify user is allowed to approve connections to target
        let isAuthorized = await isAdminOf(authCallerId, connection.target.id);
        if (!isAuthorized) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // update notifications
        const notificationsDocs = await db.collection("notifications").where("connection_id", "==", connectionId).get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({ request_status: "approved", request_updated_at: date });
        });

        // remove request
        await deleteConnectionByObject(connection, false);

        // create mutual connection between source and target
        await createConnection(connection.source.id, connection.target.id, "connected_mutually_to");
        await createConnection(connection.target.id, connection.source.id, "connected_mutually_to", true, authCallerId);

        if (connection.type === "admin_by_request") {
            await createConnection(connection.source.id, connection.target.id, "admin_by");
            await createConnection(connection.target.id, connection.source.id, "admin_of", true, authCallerId);
        }

        return res.json({ message: "Connection request approved" });
    } catch (err) {
        functions.logger.error("Error approving connection request:", err);
    }
});

// deny connection request
app.post("/connections/:id/deny", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const connectionId = req.params.id;
    const date = new Date();

    try {
        let connection = await getConnectionById(connectionId);
        if (!connection || (connection.type !== "connected_mutually_to_request" && connection.type !== "admin_by_request")) {
            return res.json({ error: "connection-request-not-found" });
        }

        // verify user is allowed to deny connections to target
        let isAuthorized = await isAdminOf(authCallerId, connection.target.id);
        if (!isAuthorized) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // update notifications
        const notificationsDocs = await db.collection("notifications").where("connection_id", "==", connectionId).get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({ request_status: "denied", request_updated_at: date });
        });

        // remove request
        await deleteConnectionByObject(connection);

        return res.json({ message: "Connection request denied" });
    } catch (err) {
        functions.logger.error("Error approving connection request:", err);
    }
});

//#endregion

//#region sign in & user

app.get("/signin", auth, async (req, res) => {
    const date = new Date();
    const authCallerId = req.user.user_id;

    try {
        const circleRef = db.collection("circles").doc(authCallerId);
        const doc = await circleRef.get();
        let user = null;

        if (!doc.exists) {
            // first time user logs in create new user node
            const newUser = {
                points: 0,
                type: "user",
                created_at: date,
            };

            if (req.user.name) {
                newUser.name = req.user.name;
            }
            if (req.user.picture) {
                newUser.picture = req.user.picture;
            }

            await circleRef.set(newUser);

            user = { ...newUser, id: authCallerId };

            // add user data
            const newUserData = getNewUserData(authCallerId, req.user.email, date);
            const userDataRef = db.collection("circle_data").doc(authCallerId);
            await userDataRef.set(newUserData);

            // create connection to earth circle
            const earth = await getCircle("earth");
            await createConnection(user, earth, "connected_to", false);
            user.isNew = true;
        } else {
            user = { ...doc.data(), id: authCallerId };
        }

        let userData = await getCircleData(authCallerId);
        let connections = await getConnections(authCallerId);
        let connectionsToUser = await getConnections(authCallerId, "target");
        let userRet = { public: user, data: userData, connections, connectionsToUser };

        return res.json(userRet);
    } catch (error) {
        functions.logger.error("Error signing in:", error);
        return res.json({ error: error });
    }
});

const setUserSeen = async (userId, circleId, category) => {
    const date = new Date();

    // update user seen
    const userDataRef = db.collection("circle_data").doc(userId);

    let seen = {
        [circleId]: {
            any: date,
            [category]: date,
        },
    };

    await userDataRef.set(
        {
            seen,
        },
        { merge: true }
    );
};

app.post("/seen", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.body.circleId;
    const category = req.body.category;

    if (
        !circleId ||
        (category !== "any" &&
            category !== "users" &&
            category !== "circles" &&
            category !== "tags" &&
            category !== "chat" &&
            category !== "events" &&
            category !== "home" &&
            category !== "settings" &&
            category !== "rooms")
    ) {
        return res.json({ error: "Invalid input" });
    }

    if (circleId === "earth") {
        return res.json({}); // ignore earth
    }

    await setUserSeen(authCallerId, circleId, category);

    return res.json({ message: "Ok" });
});

//#endregion

//#region chat

const validateChatMessageRequest = (message) => {
    // validate request
    let errors = {};
    if (!message || typeof message !== "string" || message.length > 650) {
        errors.message = "Message must be between 1 and 650 characters";
    }
    return errors;
};

// post chat message
app.post("/chat_messages", auth, async (req, res) => {
    try {
        const date = new Date();
        var circleId = req.body.circle_id;
        var message = DOMPurify.sanitize(req.body.message);
        var replyToId = req.body.replyToId;

        // validate request
        let errors = validateChatMessageRequest(message);
        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }

        const authCallerId = req.user.user_id;
        const user = await getCircle(authCallerId);

        const newMessage = {
            circle_id: circleId,
            user,
            sent_at: date,
            message: message,
        };

        if (replyToId) {
            // sanitize
            let replyToMessage = await getChatMessage(replyToId);
            if (!replyToMessage) {
                return res.json({ error: "Couldn't find message to reply to" });
            }
            newMessage.reply_to = replyToMessage;
        }

        // does message contain links?
        let links = linkify.find(message);
        if (links?.length > 0) {
            newMessage.has_links = true;
        }

        const chatMessageRef = db.collection("chat_messages").doc();
        await chatMessageRef.set(newMessage);

        // if (roomId === "public") {
        //     // TODO check if user is member of circle
        //     // if (circleId !== "earth") {
        //     //     const circleMembersDocs = await db.collection("circle_members").where("circle_id", "==", circleId).get();
        //     //     const circleMembersData = circleMembersDocs.docs[0].data();
        //     //     if (circleMembersData?.member_ids?.includes(authCallerId)) {
        //     //         newMessage.from_member = true;
        //     //     }
        //     // }

        //     // add message to public room
        //     await chatMessageRef.set(newMessage);
        // } else if (roomId === "members") {
        //     //return res.json({ error: "Not implemented" });
        //     // TODO implement sending chat to members
        //     // message sent to members
        //     // make sure user is member of circle
        //     // const circleMembersDocs = await db.collection("circle_members").where("circle_id", "==", circleId).get();
        //     // const circleMembersData = circleMembersDocs.docs[0].data();
        //     // if (!circleMembersData?.member_ids?.includes(authCallerId)) {
        //     //     return res.status(403).json({ error: "unauthorized" });
        //     // }

        //     // newMessage.circle_members_id = circleMembersDocs.docs[0].id;
        //     // newMessage.from_member = true;

        //     // // add message to members room
        //     await chatMessageRef.set(newMessage);
        // } else {
        //     // TODO make sure room exists and user is allowed to post in it
        //     return res.json({ error: "Not implemented" });
        // }

        // add update to circle that new chat message has been sent
        let updatedCircle = {
            updates: {
                any: date,
                chat: date,
            },
        };
        // update circle and propagate changes
        updateCircle(circleId, updatedCircle);

        // update user that chat message has been seen
        setUserSeen(authCallerId, circleId, "chat");

        // check if message contains link and add preview image
        addPreviewImages(chatMessageRef, links);

        // send notification to all users connected to circle
        let memberConnections = await getMemberConnections(circleId);
        let circle = await getCircle(circleId);
        for (var memberConnection of memberConnections) {
            if (memberConnection.target.id === authCallerId || memberConnection.target.type !== "user") {
                // ignore notifying sender and non-users
                continue;
            }
            await sendMessageNotification(memberConnection.target.id, circle, newMessage);
        }

        return res.json({ message: "Message sent" });
    } catch (error) {
        functions.logger.error("Error while trying to send chat message:", error);
        return res.json({ error: error });
    }
});

// update chat message
app.put("/chat_messages/:id", auth, async (req, res) => {
    const date = new Date();
    const messageId = req.params.id;
    const authCallerId = req.user.user_id;
    const editedMessage = DOMPurify.sanitize(req.body.message);

    try {
        const message = await getChatMessage(messageId);
        if (!message) {
            return res.json({ error: "chat message not found" });
        }

        if (message.user.id !== authCallerId) {
            return res.json({ error: "chat message can only be edited by owner" });
        }

        // validate request
        let errors = validateChatMessageRequest(editedMessage);
        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }

        const editedMessageObj = {
            edited_at: date,
            message: editedMessage,
        };

        // does message contain links?
        let links = linkify.find(editedMessage);
        if (links?.length > 0) {
            editedMessageObj.has_links = true;
        }

        // update chat message
        await updateChatMessage(messageId, editedMessageObj);

        // check if message contains link and add preview image
        const chatMessageRef = db.collection("chat_messages").doc(messageId);
        addPreviewImages(chatMessageRef, links);

        return res.json({ message: "message updated" });
    } catch (error) {
        functions.logger.error("Error while updating chat message:", error);
        return res.json({ error: error });
    }
});

// delete chat message
app.delete("/chat_messages/:id", auth, async (req, res) => {
    const messageId = req.params.id;
    const authCallerId = req.user.user_id;

    try {
        const message = await getChatMessage(messageId);
        if (!message) {
            return res.json({ error: "chat message not found" });
        }

        if (message.user.id !== authCallerId) {
            return res.json({ error: "chat message can only be deleted by owner" });
        }

        // delete chat message
        await deleteChatMessage(messageId);

        return res.json({ message: "message deleted" });
    } catch (error) {
        functions.logger.error("Error while deleting chat message:", error);
        return res.json({ error: error });
    }
});

// check if message contains link and adds preview image
const addPreviewImages = async (chatMessageRef, links) => {
    // add preview images
    const metaData = [];
    for (const link of links) {
        if (link.type === "url") {
            let linkUrl = link.href;
            let linkPreview = await getLinkPreview(linkUrl);
            console.debug(linkPreview);

            if (linkPreview?.mediaType) {
                metaData.push({
                    type: linkPreview.mediaType,
                    title: linkPreview.title ?? "",
                    description: linkPreview.description ?? "",
                    images: linkPreview.images ?? [],
                    site_name: linkPreview.siteName ?? "",
                    content_type: linkPreview.contentType,
                    url: linkUrl,
                });
            }
        }
    }

    if (metaData.length > 0) {
        await chatMessageRef.update({ meta_data: metaData });
    }
};

// #endregion

//#region chat messages

// update chat messages (mark as read)
app.put("/chat_notifications", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const notification_id = req.body.notification_id;
    const circle_id = req.body.circle_id;

    try {
        // get all unread notifications for user
        if (notification_id) {
            // set specific chat notification as read
            const docRef = db.collection("chat_notifications").doc(notification_id);
            await docRef.update({ is_seen: true, unread_messages: 0 });
        } else if (circle_id) {
            // set specific chat notification as read
            let notificationRef = null;
            const notificationsSnapshot = await db
                .collection("chat_notifications")
                .where("user_id", "==", authCallerId)
                .where("circle_id", "==", circle_id)
                .get();
            if (notificationsSnapshot.docs.length > 0) {
                notificationRef = db.collection("chat_notifications").doc(notificationsSnapshot.docs[0].id);
                await notificationRef.update({ is_seen: true, unread_messages: 0 });
            }
        } else {
            // set all chat notifications to user as read
            const notificationsDocs = await db.collection("chat_notifications").where("user_id", "==", authCallerId).where("is_seen", "==", false).get();
            notificationsDocs.forEach(async (notificationDoc) => {
                // set notification as read
                const docRef = db.collection("chat_notifications").doc(notificationDoc.id);
                await docRef.update({ is_seen: true });
            });
        }

        return res.json({ message: "chat notifications updated" });
    } catch (error) {
        functions.logger.error("Error while updating chat notifications:", error);
        return res.json({ error: error });
    }
});

// update chat notifications settings
app.post("/chat_notification_settings", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.body.circleId;
    const settings = req.body.settings;

    console.log("circleId:" + circleId);
    console.log("settings:" + settings);
    if (!circleId || (settings !== "on" && settings !== "off")) {
        return res.json({ error: "Invalid input" });
    }

    if (circleId === "earth") {
        return res.json({}); // ignore earth
    }

    // update user notificatin settings for circle
    const userDataRef = db.collection("circle_data").doc(authCallerId);

    let circle_settings = {
        [circleId]: {
            notifications: settings,
        },
    };

    await userDataRef.set(
        {
            circle_settings,
        },
        { merge: true }
    );

    return res.json({ message: "Ok" });
});

//#endregion

//#region notifications

// update notifications (mark as read)
app.put("/notifications", auth, async (req, res) => {
    const authCallerId = req.user.user_id;

    try {
        // get all unread notifications for user
        const notificationsDocs = await db.collection("notifications").where("user_id", "==", authCallerId).where("is_read", "==", false).get();
        notificationsDocs.forEach(async (notificationDoc) => {
            // set notification as read
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({ is_read: true });
        });

        return res.json({ message: "notifications updated" });
    } catch (error) {
        functions.logger.error("Error while updating notifications:", error);
        return res.json({ error: error });
    }
});

//#endregion

//#region admin

// performs system updates/upgrades
app.post("/update", auth, async (req, res) => {
    let config = await getConfig();
    const authCallerId = req.user.user_id;
    const command = req.body.command;

    if (!config.admins.includes(authCallerId)) {
        return res.status(403).json({ error: "unauthorized" });
    }

    try {
        // update logic here
        const commandArgs = command?.split(" ") ?? [];

        // go through all connections and add circle_types array
        if (commandArgs[0] === "circle_types") {
            let connections = await db.collection("connections").get();
            connections.forEach(async (doc) => {
                let connection = doc.data();
                let connectionRef = db.collection("connections").doc(doc.id);
                connectionRef.update({
                    circle_types: getCircleTypes(connection.source, connection.target),
                });
            });
        } else if (commandArgs[0] === "delete_circle") {
            await deleteCircle(commandArgs[1]);
        } else if (commandArgs[0] === "update_mutual_connections") {
            // go through every connection and if it's a "connected_mutually_to" then and target to source's list of mutual connections
            let connections = await db.collection("connections").get();
            connections.forEach(async (doc) => {
                let connection = doc.data();
                if (connection.type === "connected_mutually_to") {
                    // add target circle to source circle's list of mutual connections
                    const circleDataRef = db.collection("circle_data").doc(connection.source.id);
                    await circleDataRef.set({ mutual_connections: admin.firestore.FieldValue.arrayUnion(connection.target.id) }, { merge: true });
                }
            });
        } else if (commandArgs[0] === "test123") {
            // go through every circle_data and see if any of them lack corresponding circle
            let circleData = await db.collection("circle_data").get();
            let data = [];
            circleData.forEach(async (doc) => {
                let circleData = doc.data();
                if (circleData.circle_id !== doc.id) {
                    data.push(`Doc.id (${doc.id}) != circle_id (${circleData.circle_id})`);
                }
            });
            return res.json({ data: data });
        } else if (commandArgs[0] === "connect") {
            let sourceId = commandArgs[1];
            let type = commandArgs[2];
            let targetId = commandArgs[3];
            let notify = commandArgs[4];
            if (!sourceId) {
                return res.json({ error: "invalid source" });
            }
            if (!targetId) {
                return res.json({ error: "invalid target" });
            }
            if (sourceId === targetId) {
                return res.json({ error: "source can't be the same as target" });
            }

            switch (type) {
                case "connected_mutually_to":
                    await createConnection(sourceId, targetId, "connected_mutually_to", notify, authCallerId);
                    await createConnection(targetId, sourceId, "connected_mutually_to");
                    await deleteConnection(targetId, sourceId, "connected_mutually_to_request");
                    await updateTags(sourceId, targetId, "add");
                    break;
                case "admin_by":
                case "admin_of":
                    if (type === "admin_of") {
                        let targetTemp = targetId;
                        targetId = sourceId;
                        sourceId = targetTemp;
                    }
                    await createConnection(sourceId, targetId, "connected_mutually_to");
                    await createConnection(targetId, sourceId, "connected_mutually_to", notify, authCallerId);
                    await createConnection(sourceId, targetId, "admin_by");
                    await createConnection(targetId, sourceId, "admin_of", notify, authCallerId);
                    await deleteConnection(targetId, sourceId, "admin_by_request");
                    break;
                default:
                    return res.json({ error: "invalid connection type" });
            }
        } else if (commandArgs[0] === "get_connections") {
            let targetId = commandArgs[1];
            if (!targetId) {
                return res.json({ error: "invalid target" });
            }
            const connectionDocs = await db.collection("connections").where("circle_ids", "array-contains", targetId).get();

            let result = { connection_count: `${connectionDocs.docs.length} connections`, connections: [] };

            if (commandArgs[2] !== "count") {
                // loop through connections and update them
                for (var i = 0; i < connectionDocs.docs.length; ++i) {
                    let connection = connectionDocs.docs[i].data();
                    result.connections.push(connection);
                }
            }

            return res.json({ result });
        } else if (commandArgs[0] === "count_new_circles") {
            let type = commandArgs[1];
            if (!type) {
                return res.json({ error: "invalid type" });
            }
            let date = new Date(commandArgs[2]);
            const snapshot = await db.collection("circles").where("type", "==", type).where("created_at", ">=", date).get();

            let result = { count: `${snapshot.docs.length} ${type}s` };
            return res.json({ result });
        } else {
            return res.json({ error: "command not recognized" });
        }
    } catch (error) {
        console.error(error);
        return res.json({ error: error });
    }
    return res.json({ message: "OK" });
});

//#endregion

//#region exports

const runtimeOpts = {
    timeoutSeconds: 540,
    memory: "1GB",
};

exports.api = functions.region("europe-west1").runWith(runtimeOpts).https.onRequest(app);

exports.preRender = functions.https.onRequest(async (request, response) => {
    // Error 404 is false by default
    let error404 = false;

    const path = request.path ? request.path.split("/") : request.path;

    // Circle: https://circles-325718.web.app/circles/IazLuH4Pn3nhsDeP13KO

    // Event: https://circles-83729.web.app/events/GzN1oLeZxrwGeemnRQJy
    // https://circles-325718.web.app/members/z3KqKSeVFzU7lOVJsEcDQcezW4v2/events/OflMcdF7qyj0A1Q7coaP
    // https://circles-325718.web.app/circles/IazLuH4Pn3nhsDeP13KO/events/KGjgO0MWF9bMmRfM5EuG

    // Motion: https://circles-325718.web.app/motions/IazLuH4Pn3nhsDeP13KO
    // Initiative: https://circles-325718.web.app/initiatives/IazLuH4Pn3nhsDeP13KO
    // Members: https://circles-325718.web.app/members/IazLuH4Pn3nhsDeP13KO

    // <title>{motion.name}</title>
    // <meta property="og:url" content={location.pathname} />
    // <meta property="og:type" content="article" />
    // <meta property="og:title" content={motion.name} />
    // <meta property="og:description" content={motion.description} />
    // <meta property="og:image" content={motion.cover} />
    // <meta property="og:article:author" content={motion.author.name} />
    // <meta property="og:article:section" content="Motion" />
    // {motion.published_at && <meta property="og:article:published_time" content={fromFsDate(motion.published_at)} />}

    let description = "Circles";
    let type = "website";
    let title = "Circles";
    let imageUrl = path[0] + "/default-cover.png";
    let resourceId = null;
    let article = null;

    // so we can have:
    // baseurl/<resource>/something/else
    // baseurl/<resource>/id/<resource>/id
    // baseurl/<resource>/id/something/else

    if (path.length >= 2) {
        if (path[1] === "circle") {
            resourceId = path[2];
        }
    }
    // load information about resource
    let appName = "Circles";

    if (resourceId) {
        let circle = await getCircle(resourceId);
        if (circle) {
            imageUrl = circle.cover ?? path[0] + `/default-${circle.type}-cover.png`;
            description = circle.description;

            if (circle.type === "circle") {
                if (circle.language === "sv") {
                    title = `Gå med i ${circle.name} på ${appName}`;
                } else {
                    title = `Join ${circle.name} on ${appName}`;
                }
            } else if (circle.type === "event") {
                let datestr = "";
                if (circle.language === "sv") {
                    if (circle.starts_at) {
                        let dateObj = circle.starts_at.toDate();
                        let weekday = dateObj.toLocaleString("sv", { weekday: "short" });
                        let monthday = dateObj.toLocaleDateString("sv", { month: "short", day: "numeric" });
                        let time = dateObj.toLocaleTimeString("sv", { hour: "2-digit", minute: "2-digit" });
                        datestr = ` (${weekday}, ${monthday} kl ${time})`;
                    }

                    title = `Delta i eventet &quot;${circle.name}&quot;${datestr} på ${appName}`;
                } else {
                    if (circle.starts_at) {
                        let dateObj = circle.starts_at.toDate();
                        let weekday = dateObj.toLocaleString("en", { weekday: "short" });
                        let monthday = dateObj.toLocaleDateString("en", { month: "short", day: "numeric" });
                        let time = dateObj.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
                        datestr = ` (${weekday}, ${monthday} kl ${time})`;
                    }

                    title = `Attend the event &quot;${circle.name}&quot;${datestr} on ${appName}`;
                }
            } else if (circle.type === "user") {
                if (user.language === "sv") {
                    title = `Anslut till ${user.name} på ${appName}`;
                } else {
                    title = `Connect with ${user.name} on ${appName}`;
                }
            }
        }
    }

    // insert meta data to index.html
    let index = fs.readFileSync("./hosting/index.html").toString();

    // facebook open graph
    let metaData = `<meta property="og:type" content="${type}" />`;
    metaData += `<meta property="og:url" content="${request.originalUrl}" />`;
    metaData += `<meta property="og:title" content="${title}" />`;
    metaData += `<meta property="og:description" content="${description}" />`;
    metaData += `<meta property="og:image" content="${imageUrl}" />`;
    if (article) {
        metaData += `<meta property="article:author" content="${article.author}" />`;
        if (article.section) {
            metaData += `<meta property="article:section" content="${article.section}" />`;
        }
        if (article.published_time) {
            metaData += `<meta property="article:published_time" content="${article.published_time}" />`;
        }
    }

    // twitter
    metaData += `<meta name="twitter:card" content="summary_large_image" />`;
    metaData += `<meta name="twitter:title" content="${title}" />`;
    metaData += `<meta name="twitter:description" content="${description}" />`;
    metaData += `<meta name="twitter:image" content="${imageUrl}" />`;

    index = index.replace('<meta name="##METADATA##"/>', metaData);

    // sending index.html
    if (error404) {
        response.status(400).send(index);
    } else {
        response.status(200).send(index);
    }
});

//#endregion
