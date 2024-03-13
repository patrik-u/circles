//#region imports and constants
const { getLinkPreview } = require("link-preview-js");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const createDOMPurify = require("dompurify");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
const crypto = require("crypto");
const { Configuration, OpenAIApi } = require("openai");
const OneSignal = require("onesignal-node");
var jsonwebtoken = require("jsonwebtoken");
var uuid = require("uuid-random");
const PineconeClient = require("@pinecone-database/pinecone").PineconeClient;
const Linkify = require("linkify-it");
const TurndownService = require("turndown"); // HTML to Markdown for migrating old circle content
const axios = require("axios").default;

const turndownService = new TurndownService();

const linkify = new Linkify();
linkify.tlds("earth", true);

// init pinecone client
const pinecone = new PineconeClient();
let pineconeInitialized = false;
admin.initializeApp();

const express = require("express");
const cors = require("cors");

const { user } = require("firebase-functions/v1/auth");

const app = express();

app.use(cors());

const db = admin.firestore();

let oneSignalClient = null;

const defaultSearchTypes = ["circle", "post", "event", "tag", "ai_agent", "user", "document", "project"]; // default search types when not specified by user
const defaultAiSearchTypes = ["circle", "post", "event", "tag", "ai_agent", "user", "project"]; // default search types when not specified by AI
const createCircleTypes = ["circle", "post", "event", "tag", "ai_agent", "document", "project"]; // circle types that can be created by users
const indexCircleTypes = ["circle", "post", "event", "tag", "ai_agent", "user", "document", "project", "chunk"]; // circle types that are indexed in vector database for semantic search
const indexCircleChunkTypes = ["document_chunk"]; // circle chunk types that are indexed in vector database for semantic search

// const postmarkKey = defineString("POSTMARK_API_KEY");
// const mailTransport = nodemailer.createTransport(
//     postmarkTransport({
//         auth: {
//             apiKey: postmarkKey,
//         },
//     })
// );

// const Handlebars = require("handlebars");

//#endregion

//#region auth

// authorize user
const auth = async (req, res, next) => {
    if (
        (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) &&
        !(req.cookies && req.cookies.__session)
    ) {
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
const authOptional = async (req, res, next) => {
    if (
        (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) &&
        !(req.cookies && req.cookies.__session)
    ) {
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
    } catch (error) {}
    next();
};

//#endregion

//#region helper functions

const getOneSignalClient = () => {
    if (!oneSignalClient) {
        oneSignalClient = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);
    }
    return oneSignalClient;
};

const getLatlng = (coords) => {
    if (!coords) return { latitude: 0, longitude: 0 };

    let lat = coords.latitude ?? coords._latitude ?? 0;
    let lng = coords.longitude ?? coords._longitude ?? 0;
    return { latitude: lat, longitude: lng };
};

const calculateMapCenter = (locations) => {
    let sumLat = 0.0;
    let sumLng = 0.0;

    // iterate through each location to sum latitudes and longitudes
    locations.forEach((loc) => {
        sumLat += loc.latitude;
        sumLng += loc.longitude;
    });

    // calculate average latitude and longitude
    const avgLat = sumLat / locations.length;
    const avgLng = sumLng / locations.length;

    // return the calculated center
    return { latitude: avgLat, longitude: avgLng };
};

const calculateMapZoomFactor = (locations) => {
    // constants for calculations
    const MAX_LATITUDE = 85.0511287798; // Maximum latitude for Web Mercator projection

    // calculate bounds
    let minLat = Math.min(...locations.map((loc) => loc.latitude));
    let maxLat = Math.max(...locations.map((loc) => loc.latitude));
    minLat = Math.max(minLat, -MAX_LATITUDE);
    maxLat = Math.min(maxLat, MAX_LATITUDE);
    let minLng = Math.min(...locations.map((loc) => loc.longitude));
    let maxLng = Math.max(...locations.map((loc) => loc.longitude));

    // calculate latitudinal and longitudinal spans
    let latSpan = maxLat - minLat;
    let lngSpan = maxLng - minLng;

    // calculate zoom factor (simplified and conceptual)
    let latZoom = -Math.log(latSpan / 360) / Math.log(2);
    let lngZoom = -Math.log(lngSpan / 360) / Math.log(2);

    // return the minimum of the two zooms as the factor
    return Math.min(latZoom, lngZoom);
};

const calculateMapBounds = (locations) => {
    // get minimum and maximum latitudes and longitudes
    let minLat = Math.min(...locations.map((loc) => loc.latitude));
    let maxLat = Math.max(...locations.map((loc) => loc.latitude));
    let minLng = Math.min(...locations.map((loc) => loc.longitude));
    let maxLng = Math.max(...locations.map((loc) => loc.longitude));

    // return the calculated bounds
    const bounds = {
        southwest: { latitude: minLat, longitude: minLng },
        northeast: { latitude: maxLat, longitude: maxLng },
    };

    return bounds;
};

const getPinecone = async () => {
    if (pineconeInitialized) {
        return pinecone;
    } else {
        try {
            await pinecone.init({
                environment: process.env.PINECONE_ENVIRONMENT,
                apiKey: process.env.PINECONE_API_KEY,
            });
            pineconeInitialized = true;
            return pinecone;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
};

const sha256 = (input) => {
    return crypto.createHash("sha256").update(input).digest("hex");
};

const getCircle = async (circleId) => {
    let circleDoc = await db.collection("circles").doc(circleId).get();
    if (!circleDoc.exists) return null;
    return { id: circleId, ...circleDoc.data(), activity: {} };
};

const getCircleData = async (circleId) => {
    const circleDataDirectRef = db.collection("circle_data").doc(circleId);
    const circleDataDirectSnapshot = await circleDataDirectRef.get();
    if (circleDataDirectSnapshot.exists) {
        return {
            id: circleDataDirectSnapshot.id,
            ...circleDataDirectSnapshot.data(),
        };
    }

    // see if indirect reference exist
    const circleDataRef = db.collection("circle_data");
    const circleDataSnapshot = await circleDataRef.where("circle_id", "==", circleId).get();
    if (circleDataSnapshot.docs.length <= 0) return null;
    const userDetailDocId = circleDataSnapshot.docs[0].id;
    return { id: userDetailDocId, ...circleDataSnapshot.docs[0].data() };
};

const getTagByName = async (name, createIfNotExist = false) => {
    let tagDoc = await db.collection("circles").where("type", "==", "tag").where("name", "==", name).get();
    if (tagDoc.docs.length <= 0) {
        if (createIfNotExist) {
            let newTagData = {
                type: "tag",
                name: name,
                created_at: new Date(),
                language: "en",
                text: "#" + name,
                description: "",
            };

            let newTag = db.collection("circles").doc();
            await newTag.set(newTagData);
            return { id: newTag.id, ...newTagData };
        } else {
            return null;
        }
    }
    return { id: tagDoc.docs[0].id, ...tagDoc.docs[0].data() };
};

const getAdminConnections = async (id) => {
    let query = db
        .collection("connections")
        .where("source.id", "==", id)
        .where("types", "array-contains-any", ["owned_by", "admin_by"]);
    let result = await query.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

const getMemberConnections = async (id) => {
    if (!id) {
        return [];
    }
    let query = db
        .collection("connections")
        .where("source.id", "==", id)
        .where("types", "array-contains", "connected_mutually_to");
    let result = await query.get();
    return result?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
};

// gets connections to circle that are relevant (parent and members)
const getRelevantConnections = async (id) => {
    if (!id) {
        return [];
    }
    let query = db
        .collection("connections")
        .where("source.id", "==", id)
        .where("types", "array-contains-any", ["connected_mutually_to", "parented_by", "parent_of"]);
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

const getConnection = async (sourceId, targetId) => {
    let connectionsRef = db
        .collection("connections")
        .where("source.id", "==", sourceId)
        .where("target.id", "==", targetId);
    let connectionsSnapshot = await connectionsRef.get();
    if (connectionsSnapshot.docs.length <= 0) return null;
    const connectionDocId = connectionsSnapshot.docs[0].id;
    return { id: connectionDocId, ...connectionsSnapshot.docs[0].data() };
};

const getConnectionWithType = async (sourceId, targetId, type) => {
    let connectionsRef = db
        .collection("connections")
        .where("source.id", "==", sourceId)
        .where("target.id", "==", targetId)
        .where("types", "array-contains", type);
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

const validateCommentRequest = (comment) => {
    // validate request
    let errors = {};
    if (!comment || typeof comment !== "string" || comment.length > 6500) {
        errors.comment = "Comment must be between 1 and 6500 characters";
    }
    return errors;
};

// converts firestore date to javascript date
const fromFsDate = (date) => {
    if (!date) return date;

    if (date._seconds) {
        return new Date(date._seconds * 1000);
    } else if (date.seconds) {
        return new Date(date.seconds * 1000);
    } else if (typeof date === "number") {
        return new Date(date);
    } else {
        return date;
    }
};

// create textual representation of chunk
const getCircleChunkText = (chunk) => {
    const maxTokens = 8192 - 192; // ada-02 supports max 8192 tokens, and we add some margin for inaccuracy when estimating tokens

    // create textual representation of chunk
    let text = `ID: ${chunk.id}\n`;
    text += `Chunk Type: ${chunk.type}\n`;
    text += `Context: ${chunk.context}\n`;
    if (chunk.score) {
        text += `Similarity score: ${chunk.score}\n`;
    }
    if (chunk.content?.length > 0) {
        text += `Content:\n${chunk.content?.slice(0, maxTokens)}\n`;
    }
    return text;
};

// create textual representation of circle
const getCircleText = (circle, condensed = false, ignoreSummary = false) => {
    const maxTokens = 8192 - 192; // ada-02 supports max 8192 tokens, and we add some margin for inaccuracy when estimating tokens

    // create textual representation of circle

    let text = `ID: ${circle.id}\n`;
    text += `Type: ${circle.type}\n`;
    text += `Name: ${circle.name}\n`;
    if (circle.score) {
        text += `Similarity score: ${circle.score}\n`;
    }
    if (circle.tags?.length > 0) {
        text += `Tags: ${circle.tags?.map((x) => x.name).join(", ")}\n`;
    }
    if (circle.location?.name) {
        text += `Location: ${circle.location?.name}\n`;
    }
    if (!ignoreSummary && circle.description?.length > 0) {
        text += `Description: ${circle.description}\n`;
    }
    text += `URL: https://codo.earth/circles/${circle.id}\n`;
    if (circle.type === "event") {
        // add info about event
        text += `Starts at: ${fromFsDate(circle.starts_at)?.toISOString()}\n`;
    }
    if (circle.mission?.length > 0) {
        text += `Mission: ${circle.mission}\n`;
    }
    if (circle.offers?.length > 0) {
        text += `Offers: ${circle.offers}\n`;
    }
    if (circle.needs?.length > 0) {
        text += `Needs: ${circle.needs}\n`;
    }
    if (!condensed) {
        let chars = text.length;
        if (circle.content?.length > 0) {
            text += `Content:\n${circle.content?.slice(0, maxTokens * 4 - chars)}\n`;
        }
        if (circle.type === "user") {
            // add info about answered prompts
            let q0 = circle.questions?.question0?.label;
            let q1 = circle.questions?.question1?.label;
            let q2 = circle.questions?.question2?.label;
            let a0 = circle.questions?.question0?.answer;
            let a1 = circle.questions?.question1?.answer;
            let a2 = circle.questions?.question2?.answer;
            if (q0 && a0) text += `${q0}\n${a0}\n`;
            if (q1 && a1) text += `${q1}\n${a1}\n`;
            if (q2 && a2) text += `${q2}\n${a2}\n`;
        }
    }
    //console.log("circle text: " + text);
    // TODO add textual representation of location if set
    return text;
};

const getEmbedding = async (text) => {
    return (await getEmbeddings([text]))?.[0];
};

const getEmbeddings = async (textArray) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    // TODO make sure each text in array is less than 8192 tokens

    const openai = new OpenAIApi(configuration);
    const response = await openai.createEmbedding({
        input: textArray,
        model: "text-embedding-ada-002",
    });

    return response?.data?.data?.map((x) => x.embedding);
};

const upsertCircleEmbedding = async (circle) => {
    if (typeof circle === "string") {
        circle = await getCircle(circle);
    }
    if (!circle) return null;
    return await upsertCirclesEmbeddings([circle]);
};

const upsertCirclesEmbeddings = async (circles) => {
    // loops through all circles and creates embeddings for them and stores them in the pinecone database
    let circleEmbeddingRequests = [];

    // loop through circles and get embedding text
    for (var i = 0; i < circles.length; ++i) {
        let circle = circles[i];

        // only index user and circle circles
        if (!indexCircleTypes.includes(circle.type)) {
            continue;
        }

        let embeddingRequest = {
            circle: {
                id: circle.id,
                name: circle.name,
                type: circle.type,
                parent_id: circle.parent_circle?.id,
            },
            embedding: null,
            text: null,
        };

        // create textual representation of circle
        let text = getCircleText(circle);

        embeddingRequest.text = text;
        circleEmbeddingRequests.push(embeddingRequest);
    }

    // create embeddings using openai
    let embeddings = null;
    let insertBatches = [];
    let pineconeEmbeddings = null;
    try {
        embeddings = await getEmbeddings(circleEmbeddingRequests.map((x) => x.text));

        // insert embeddings into pinecone
        pineconeEmbeddings = circleEmbeddingRequests.map((x, i) => {
            let metadata = {
                id: x.circle.id,
                name: x.circle.name,
                type: x.circle.type,
            };
            if (x.circle.parent_id) {
                // id of the parent circle
                metadata.parent_id = x.circle.parent_id;
            }
            return {
                id: x.circle.id,
                metadata: metadata,
                values: embeddings[i],
            };
        });

        // add 250 vectors at a time to pinecone
        let pineconeService = await getPinecone();
        while (pineconeEmbeddings.length) {
            let batchedVectors = pineconeEmbeddings.splice(0, 250);
            const index = pineconeService.Index("circles");
            let pineconeResponse = await index.upsert({
                upsertRequest: { vectors: batchedVectors },
            });
            insertBatches.push(pineconeResponse);
        }

        return insertBatches;
    } catch (error) {
        return { error: error };
    }
};

const upsertCircleChunksEmbeddings = async (chunks, circle) => {
    // loops through all chunks and creates embeddings for them and stores them in the pinecone database
    let chunkEmbeddingRequests = [];

    // loop through circles and get embedding text
    for (var i = 0; i < chunks.length; ++i) {
        let chunk = chunks[i];
        let chunkType = circle.type + "_chunk";
        if (!indexCircleChunkTypes.includes(chunkType)) {
            continue;
        }

        let embeddingRequest = {
            circle: {
                id: "circles/" + circle.id + "/chunks/" + chunk.id,
                name: chunk.context,
                type: chunkType,
                parent_id: circle.id,
            },
            embedding: null,
            text: null,
        };

        // create textual representation of chunk
        let text = getCircleChunkText(chunk);

        embeddingRequest.text = text;
        chunkEmbeddingRequests.push(embeddingRequest);
    }

    // create embeddings using openai
    let embeddings = null;
    let insertBatches = [];
    let pineconeEmbeddings = null;
    try {
        embeddings = await getEmbeddings(chunkEmbeddingRequests.map((x) => x.text));

        // insert embeddings into pinecone
        pineconeEmbeddings = chunkEmbeddingRequests.map((x, i) => {
            let metadata = {
                id: x.circle.id,
                name: x.circle.name,
                type: x.circle.type,
            };
            if (x.circle.parent_id) {
                // id of the parent circle
                metadata.parent_id = x.circle.parent_id;
            }
            return {
                id: x.circle.id,
                metadata: metadata,
                values: embeddings[i],
            };
        });

        // add 250 vectors at a time to pinecone
        let pineconeService = await getPinecone();
        while (pineconeEmbeddings.length) {
            let batchedVectors = pineconeEmbeddings.splice(0, 250);
            const index = pineconeService.Index("circles");
            let pineconeResponse = await index.upsert({
                upsertRequest: { vectors: batchedVectors },
            });
            insertBatches.push(pineconeResponse);
        }

        return insertBatches;
    } catch (error) {
        console.log(error);
        return { error: error };
    }
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

const getComment = async (commentId) => {
    let commentDoc = await db.collection("comments").doc(commentId).get();
    if (!commentDoc.exists) return null;
    return { id: commentId, ...commentDoc.data() };
};

const getCircleTypes = (source, target) => {
    if (!source || !target) return "";
    const types = [source.type, target.type];
    return types.sort().join("_");
};

const propagateCircleUpdate = async (id) => {
    const circleRef = db.collection("circles").doc(id);
    let circleDoc = await circleRef.get();
    let circleData = circleDoc?.data();
    if (!circleData) return;

    const connectionDocs = await db.collection("connections").where("circle_ids", "array-contains", id).get();
    circleData.id = circleDoc.id;
    circleData.activity = {};

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

    // update circles with this circle as creator
    const creatorDocs = await db.collection("circles").where("creator.id", "==", id).get();
    batchArray = [db.batch()];
    operationCounter = 0;
    batchIndex = 0;

    // loop through circles and update creator
    for (var i = 0; i < creatorDocs.docs.length; ++i) {
        let creatorCircleRef = db.collection("circles").doc(creatorDocs.docs[i].id);

        batchArray[batchIndex].set(creatorCircleRef, { creator: circleData }, { merge: true });
        ++operationCounter;
        if (operationCounter >= 499) {
            batchArray.push(db.batch());
            ++batchIndex;
            operationCounter = 0;
        }
    }

    batchArray.forEach(async (batch) => await batch.commit());

    // update relation-sets that this circle is part of
    const setDocs = await db.collection("circles").where("circle_ids", "array-contains", id).get();
    batchArray = [db.batch()];
    operationCounter = 0;
    batchIndex = 0;

    // loop through sets and update them
    for (var i = 0; i < setDocs.docs.length; ++i) {
        let setRef = db.collection("circles").doc(setDocs.docs[i].id);

        batchArray[batchIndex].set(setRef, { [id]: circleData }, { merge: true });
        ++operationCounter;
        if (operationCounter >= 499) {
            batchArray.push(db.batch());
            ++batchIndex;
            operationCounter = 0;
        }
    }

    batchArray.forEach(async (batch) => await batch.commit());

    //  loop through user settings favorite circles and update them
    const favoriteDocs = await db.collection("circle_data").where(`circle_settings.${id}.favorite`, "==", true).get();
    batchArray = [db.batch()];
    operationCounter = 0;
    batchIndex = 0;

    // loop through each user data and update favorites
    for (var i = 0; i < favoriteDocs.docs.length; ++i) {
        let circleDataRef = db.collection("circle_data").doc(favoriteDocs.docs[i].id);
        let circleDoc = await circleDataRef.get();
        let circleDataData = circleDoc?.data();

        let oldSettings = circleDataData?.circle_settings[id];
        if (!oldSettings) continue;

        let newSettings = { ...oldSettings };
        newSettings.circle = getSettingsCircle(circleData);
        let circle_settings = {
            [id]: newSettings,
        };

        batchArray[batchIndex].set(circleDataRef, { circle_settings }, { merge: true });
        ++operationCounter;
        if (operationCounter >= 499) {
            batchArray.push(db.batch());
            ++batchIndex;
            operationCounter = 0;
        }
    }

    batchArray.forEach(async (batch) => await batch.commit());
};

// updates circle data
const updateCircle = async (id, circle, propagateUpdate = true, useUpdate = false) => {
    const circleRef = db.collection("circles").doc(id);
    let circleDoc = await circleRef.get();
    if (!circleDoc.exists) {
        return null;
    }

    delete circle.id;

    if (useUpdate) {
        // update circle
        await circleRef.update(circle);
    } else {
        // update circle
        await circleRef.set(circle, {
            merge: true,
        });
    }

    circle.id = id;

    let circleData = null;
    if (propagateUpdate) {
        circleData = await propagateCircleUpdate(id);
    }

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

// update comment
const updateComment = async (id, comment) => {
    const commentRef = db.collection("comments").doc(id);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
        return null;
    }

    delete comment.id;

    // update comment
    await commentRef.set(comment, {
        merge: true,
    });
};

// deletes circle
const deleteCircle = async (id) => {
    const circleRef = db.collection("circles").doc(id);

    // delete circle chunks
    const chunksRef = circleRef.collection("chunks");
    const snapshots = await chunksRef.get();
    const chunkIdsToDelete = snapshots.docs.map((doc) => "circles/" + id + "/chunks/" + doc.id);

    // delete chunks from pinecone using fetched IDs
    if (chunkIdsToDelete.length > 0) {
        try {
            let pineconeService = await getPinecone();
            const index = pineconeService.Index("circles");
            await index.delete1({ ids: chunkIdsToDelete });
        } catch (error) {
            console.log(error);
        }
    }

    // delete chunks from firestore
    const batch = db.batch();
    snapshots.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

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

    // remove from pinecone
    try {
        let pineconeService = await getPinecone();
        const index = pineconeService.Index("circles");
        await index.delete1({ ids: [id] });
    } catch (error) {
        console.log(error);
    }

    // delete comments
    const commentsSnapshot = await db.collection("comments").where("circle_id", "==", id).get();
    commentsSnapshot.forEach(async (commentDoc) => {
        const docRef = db.collection("comments").doc(commentDoc.id);
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
    let connection = await getConnection(source.id, target.id);
    let connectionRef = null;
    if (connection) {
        if (connection.types.includes(type)) return;

        // add type to existing connection
        connectionRef = db.collection("connections").doc(connection.id);
        await connectionRef.set(
            {
                types: admin.firestore.FieldValue.arrayUnion(type),
                [type + "_data"]: { created_at },
            },
            { merge: true }
        );
    } else {
        // create new connection
        connectionRef = db.collection("connections").doc();
        await connectionRef.set({
            source,
            target,
            types: [type],
            circle_ids: [source.id, target.id],
            circle_types: getCircleTypes(source, target),
            [type + "_data"]: { created_at },
        });

        // update target circle connection count
        let updatedCircle = {
            connections: admin.firestore.FieldValue.increment(1),
        };

        if (
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

    // add target circle to source circle's list of connections
    const circleDataRef = db.collection("circle_data").doc(source.id);
    await circleDataRef.set({ [type]: admin.firestore.FieldValue.arrayUnion(target.id) }, { merge: true });

    // if connected to a circle, add it to source's favorites
    if (type === "connected_mutually_to" && target.type === "circle") {
        await updateCircleSettings(authCallerId, source.id, target.id, { favorite: true }, false);
    }
};

// deletes connection between two circles
const deleteConnection = async (source, target, type, updateNotifications = true) => {
    if (typeof source === "string") {
        source = await getCircle(source);
    }
    if (typeof target === "string") {
        target = await getCircle(target);
    }

    // see if connection exists
    let connection = await getConnection(source.id, target.id);
    if (!connection || !connection.types.includes(type)) return;

    let lastConnection = connection.types.length === 1;
    if (lastConnection) {
        await deleteConnectionByObject(connection);
    } else {
        // delete type from connection
        const connectionRef = db.collection("connections").doc(connection.id);
        await connectionRef.set(
            {
                types: admin.firestore.FieldValue.arrayRemove(type),
                [type]: admin.firestore.FieldValue.delete(),
            },
            { merge: true }
        );
    }

    // update any notifications around the request
    if (type === "connected_mutually_to_request" && updateNotifications) {
        let date = new Date();
        // update notifications
        const notificationsDocs = await db
            .collection("notifications")
            .where("connection_id", "==", connection.id)
            .get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({
                request_status: "denied",
                request_updated_at: date,
            });
        });
    }

    // remove target circle from source circle's list of connections
    const circleDataRef = db.collection("circle_data").doc(connection.source.id);
    await circleDataRef.update({
        [type]: admin.firestore.FieldValue.arrayRemove(connection.target.id),
    });

    // CONNECT123 here we might want to update latest_connections as well
};

const deleteConnectionByObject = async (connection) => {
    const connectionRef = db.collection("connections").doc(connection.id);
    await connectionRef.delete();

    // update target circle connection count
    const circleRef = db.collection("circles").doc(connection.target.id);
    await circleRef.update({
        connections: admin.firestore.FieldValue.increment(-1),
    });
};

const createZoomMeeting = async (circle) => {
    // check if circle is ID or object
    if (typeof circle === "string") {
        circle = await getCircle(circle);
    }

    // Meeting does not exist, so create one
    const zoomUserId = "me"; // Or the specific Zoom user ID if needed
    const apiKey = process.env.ZOOM_SDK_KEY;
    const apiSecret = process.env.ZOOM_SDK_SECRET;

    // print out part of the apiKey and apiSecret
    console.log("apiKey: " + apiKey?.substring(0, 5) + "...");
    console.log("apiSecret: " + apiSecret?.substring(0, 5) + "...");

    const token = jsonwebtoken.sign({ iss: apiKey, exp: new Date().getTime() + 5000 }, apiSecret);

    const createMeetingResponse = await axios.post(
        `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
        {
            topic: `${circle.name} Meeting`,
            type: 8, // 8 for a recurring meeting with no fixed time
            settings: {
                join_before_host: true,
                // ... additional settings
            },
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    let meetingNumber = createMeetingResponse?.data?.id;
    if (meetingNumber) {
        await updateCircle(circle.id, { zoom_meeting_number: meetingNumber });
    }
    return meetingNumber;
};

const generateZoomToken = (apiKey, secret, meetingNumber, role) => {
    const iat = Math.round(new Date().getTime() / 1000);
    const exp = iat + 60 * 60 * 2;

    // JWT payload for Zoom Meeting SDK
    const payload = {
        appKey: apiKey,
        sdkKey: apiKey,
        mn: meetingNumber,
        iat,
        exp,
        tokenExp: exp,
        role: role,
    };

    return jsonwebtoken.sign(payload, secret);
};

const generateJitsiToken = (privateKey, { id, name, email, avatar, appId, domain, kid }) => {
    const now = new Date();
    const jwt = jsonwebtoken.sign(
        {
            aud: "jitsi",
            context: {
                user: {
                    id,
                    name,
                    avatar,
                    email: email,
                    moderator: "true",
                },
            },
            iss: appId,
            room: "*",
            sub: domain,
            exp: Math.round(now.setHours(now.getHours() + 148) / 1000), // expires in 148 hours
            nbf: Math.round(new Date().getTime() / 1000) - 10,
        },
        privateKey,
        { algorithm: "RS256", header: { kid } }
    );
    return jwt;
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

const sendMessageNotification = async (target, circle, message, bigPicture, category) => {
    // const newMessage = {
    //     circle_id: circleId,
    //     user,
    //     sent_at: date,
    //     message: message,
    // };

    // chat notification looks like this:
    //"[circle] Tim: Hey blah blah..." (number of unread messages)

    let notificationRef = null;
    const notificationsSnapshot = await db
        .collection("chat_notifications")
        .where("user_id", "==", target.id)
        .where("circle_id", "==", message.circle_id)
        .get();
    if (notificationsSnapshot.docs.length <= 0) {
        notificationRef = db.collection("chat_notifications").doc();
    } else {
        notificationRef = db.collection("chat_notifications").doc(notificationsSnapshot.docs[0].id);
    }

    const date = new Date();
    const newNotification = {
        user_id: target.id,
        circle_id: message.circle_id,
        circle: circle,
        date: date,
        unread_messages: admin.firestore.FieldValue.increment(1),
        is_seen: false,
        last_message: message,
    };

    let circleSettings = await getUserCircleSettings(target.id, message.circle_id);
    if (circleSettings?.notifications === "off") {
        newNotification.unread_messages = 0;
        newNotification.is_seen = true;
        delete newNotification.date;
    }

    await notificationRef.set(newNotification, { merge: true });

    // send push notification
    await sendPushNotification(message.user, target, message.message, circle, bigPicture, category);
};

// returns true if source is administrator of target
const isAdminOf = async (sourceId, targetId) => {
    if (sourceId === targetId) return true;
    let connection = await getConnection(targetId, sourceId);
    return connection && (connection.types.includes("admin_by") || connection.types.includes("owned_by"));
};

// returns true if source is member of target
const isMemberOf = async (sourceId, targetId) => {
    if (sourceId === targetId) return true;
    let connection = await getConnectionWithType(targetId, sourceId, "connected_mutually_to");
    return !connection === false;
};

// returns true if source is owner of target
const isOwnerOf = async (sourceId, targetId) => {
    if (sourceId === targetId) return true;
    let ownedBy = await getConnectionWithType(targetId, sourceId, "owned_by");
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

// sets circle content the user has seen
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

const updateMapViewport = async (circleId) => {
    const circle = await getCircle(circleId);
    if (!circle) return;

    // get all circles with this parent circle
    const circles = await db
        .collection("circles")
        .where("parent_circle.id", "==", circleId)
        .where("type", "==", "circle")
        .get();

    // get all locations
    let locations = [];
    if (circle.base) {
        locations.push(getLatlng(circle.base));
    }
    circles.forEach((doc) => {
        let circle = doc.data();
        if (circle.base) {
            locations.push(getLatlng(circle.base));
        }
    });

    if (locations.length <= 0) return;

    // calculate map location center
    let mapCenter = calculateMapCenter(locations);

    // calculate map zoom factor
    let mapZoomFactor = calculateMapZoomFactor(locations);

    // calculate bounds
    let mapBounds = calculateMapBounds(locations);

    let calculated_map_viewport = {
        center: mapCenter,
        zoom_factor: mapZoomFactor,
        bounds: mapBounds,
    };

    // update circle
    await updateCircle(circleId, { calculated_map_viewport: calculated_map_viewport });
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

// updates or inserts circle
const upsertCircle = async (authCallerId, circleReq) => {
    let errors = {};
    const date = new Date();

    // console.log("upserting circle" + JSON.stringify(circleReq, 2, null));

    let circle = {};
    let newCircle = circleReq.id ? false : true;
    let type = circleReq.type;
    let currentCircle = null;
    if (!newCircle) {
        currentCircle = await getCircle(circleReq.id);
        if (!currentCircle) {
            errors.circle = "Circle not found";
            return { errors };
        } else {
            // check if user is owner or admin and allowed to update circle data
            const isAuthorized = await isAdminOf(authCallerId, circleReq.id);
            if (!isAuthorized) {
                errors.circle = "User is not authorized to update circle";
                return { errors };
            }
        }
        type = currentCircle.type;
    }

    // required fields for new circles
    if (newCircle) {
        if (circleReq.type !== "post") {
            if (!circleReq.name) {
                errors.name = "Name must not be empty";
            }
        }
        if (!circleReq.type) {
            errors.type = "Type must not be empty";
        }
    }

    // validate data
    if (circleReq.name) {
        if (circleReq.name.length > 50) {
            errors.name = "Name must be between 1 and 50 characters";
        } else {
            circle.name = circleReq.name;
        }
    }
    if (circleReq.type) {
        if (!newCircle && circleReq.type !== type) {
            errors.type = "Cannot change type of existing circle";
        } else if (!createCircleTypes.includes(circleReq.type)) {
            errors.type = "Invalid circle type";
        } else {
            circle.type = circleReq.type;
        }
    }
    if (circleReq.cover) {
        circle.cover = circleReq.cover;
    }
    if (circleReq.picture) {
        circle.picture = circleReq.picture;
    }
    if (circleReq.media) {
        circle.media = circleReq.media;
    }

    let baseChanged = false;
    if (circleReq.base) {
        circle.base = circleReq.base;

        if (currentCircle) {
            // check if base has changed
            let currentLoc = getLatlng(currentCircle.base);
            let newLoc = getLatlng(circleReq.base);
            if (currentLoc.latitude !== newLoc.latitude || currentLoc.longitude !== newLoc.longitude) {
                baseChanged = true;
            }
        } else {
            baseChanged = true;
        }
    }

    if (circleReq.description !== undefined) {
        circle.description = circleReq.description;
    }
    let links = null;
    if (circleReq.content !== undefined) {
        circle.content = circleReq.content;

        if (circle.type === "post") {
            // check for links and mentions in content
            links = linkify.match(circle.content);
            if (links) {
                // check if link points to circle
                let circleIds = [];
                for (var link of links) {
                    let circleId = extractCircleId(link.url);
                    if (circleId) {
                        circleIds.push(circleId);

                        // remove link from links
                        let linkUrl = link.url;
                        links = links.filter((x) => x.url !== linkUrl);
                    }
                }

                if (circleIds.length > 0) {
                    // get mentions
                    let mentions = await getCirclesFromIds(circleIds);
                    if (mentions) {
                        circle.mentions = mentions;
                        circle.has_mentions = true;
                    }
                }
                if (links?.length > 0) {
                    circle.has_links = true;
                }
            }
        }
    }
    if (circleReq.lexical_content !== undefined) {
        circle.lexical_content = circleReq.lexical_content;
    }
    if (circleReq.language) {
        circle.language = circleReq.language;
    }
    if (circleReq.mission !== undefined) {
        circle.mission = circleReq.mission;
    }
    if (circleReq.offers !== undefined) {
        circle.offers = circleReq.offers;
    }
    if (circleReq.needs !== undefined) {
        circle.needs = circleReq.needs;
    }
    if (circleReq.social_media) {
        circle.social_media = circleReq.social_media;
    }
    if (circleReq.jitsi_id) {
        circle.jitsi_id = circleReq.jitsi_id;
    }
    if (circleReq.zoom_meeting_number) {
        circle.zoom_meeting_number = circleReq.zoom_meeting_number;
    }

    if (circleReq.tags) {
        if (!Array.isArray(circleReq.tags)) {
            errors.tags = "Invalid tags data";
        }
        let validatedTags = [];
        for (const tag of circleReq.tags) {
            if (tag.is_custom) {
                // create tag if it doesn't exist
                let newTag = await getTagByName(tag.name, true);
                validatedTags.push(newTag);
            } else {
                validatedTags.push(tag);
            }
        }
        circle.tags = validatedTags;
    }
    if (circleReq.questions) {
        circle.questions = circleReq.questions;
        if (circle.questions.question0?.to_delete) {
            circle.questions.question0 = admin.firestore.FieldValue.delete();
        }
        if (circle.questions.question1?.to_delete) {
            circle.questions.question1 = admin.firestore.FieldValue.delete();
        }
        if (circle.questions.question2?.to_delete) {
            circle.questions.question2 = admin.firestore.FieldValue.delete();
        }
    }
    if (circleReq.funding) {
        circle.funding = circleReq.funding;
    }

    if (type === "event") {
        console.log(circleReq.starts_at);
        if (circleReq.starts_at) {
            circle.starts_at = new Date(circleReq.starts_at);
        }
        if (circleReq.is_all_day) {
            circle.is_all_day = circleReq.is_all_day;
        }
        if (circleReq.time) {
            circle.time = circleReq.time;
        }
        if (circleReq.duration) {
            circle.duration = circleReq.duration;
        }
        if (circleReq.rrule) {
            circle.rrule = circleReq.rrule;
        }
    }

    if (circleReq.is_public !== undefined) {
        circle.is_public = circleReq.is_public === true;
    }
    if (circleReq.ai_summary !== undefined) {
        circle.ai_summary = circleReq.ai_summary === true;
    }

    // verify user is admin of parent circle
    let oldParentId = currentCircle?.parent_circle?.id;
    let hasNewParent = false;
    let parent = null;
    if (circleReq.parent_circle !== undefined) {
        let parentId = circleReq.parent_circle?.id;
        if (parentId === "global") {
            parentId = null;
            circle.parent_circle = false;
        } else {
            if (parentId !== oldParentId) {
                hasNewParent = true;
                if (parentId) {
                    // check if user is owner or admin and allowed to set circle parent
                    parent = await getCircle(parentId);
                    if (!parent.is_public) {
                        const isAuthorized = await isAdminOf(authCallerId, parentId);
                        if (!isAuthorized) {
                            errors.parent_circle = "User must be admin of parent circle";
                        }
                    }
                }
                circle.parent_circle = parent ?? false;
            }
        }
    }

    if (Object.keys(errors).length !== 0) {
        return { errors };
    }

    if (Object.keys(circle).length <= 0) {
        return currentCircle;
    }

    if (newCircle) {
        // create circle
        let user = await getCircle(authCallerId);
        circle.created_at = date;
        circle.created_by = authCallerId;
        circle.creator = user;
        circle.updated_at = date;
        circle.version = 1;

        // add circle to circles collection
        const circleRes = await db.collection("circles").add(circle);

        // add connections to circle
        circle = await getCircle(circleRes.id);

        // TODO these can perhaps be removed since we can store the information in circle_data and the relation-set
        await createConnection(user, circle, "owner_of", false, null, false);
        await createConnection(circle, user, "owned_by", false, null, false);
        await createConnection(user, circle, "creator_of", false, null, false);
        await createConnection(circle, user, "created_by", false, null, false);
        await createConnection(user, circle, "connected_to", false, null, false);

        if (circle.type !== "tag") {
            await createConnection(user, circle, "connected_mutually_to", false, null, false);
            await createConnection(circle, user, "connected_mutually_to", false, null, false);
        }

        if (parent) {
            await createConnection(parent, circle, "parent_of", false, null, false);
            await createConnection(circle, parent, "parented_by", false, null, false);
        }
    } else {
        // update circle
        let circleId = circleReq.id;
        circle.updated_at = date;
        circle.version = admin.firestore.FieldValue.increment(1);
        await updateCircle(circleId, circle);
        circle = await getCircle(circleId);

        // update connection to parent if changed
        if (hasNewParent) {
            if (oldParentId) {
                let oldParent = await getCircle(oldParentId);
                await deleteConnection(oldParent, currentCircle, "parent_of");
                await deleteConnection(currentCircle, oldParent, "parented_by");
            }

            // add new parent
            if (parent) {
                await createConnection(parent, circle, "parent_of", false, null, false);
                await createConnection(circle, parent, "parented_by", false, null, false);
            }
        }
        // update connection to tags
        if (circle.tags) {
            // clear all connections to previous tags
            if (currentCircle.tags) {
                for (const tag of currentCircle.tags) {
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
            for (const tag of circle.tags) {
                let tagId = tag.id;
                await createConnection(circleId, tagId, "connected_mutually_to");
                await createConnection(tagId, circleId, "connected_mutually_to");
            }
        }
    }

    if (hasNewParent || baseChanged) {
        // calculate new map viewport for old and new parent circle
        if (oldParentId) {
            await updateMapViewport(oldParentId);
        }
        if (circle.parent_circle?.id) {
            await updateMapViewport(circle.parent_circle.id);
        }
    }

    // upsert embeddings
    upsertCircleEmbedding(circle.id);

    // update summary if ai_summary is true
    if (circle.ai_summary && circle.type !== "document" && circle.type !== "post") {
        // disable AI summaries for documents and posts for now as they change frequently during editing
        generateAiSummary(circle); // do this in background so we don't have to wait for it
    }

    // add preview images
    if (circle.has_links) {
        const circleRef = db.collection("circles").doc(circle.id);
        addPreviewImages(circleRef, links);
    }

    return circle;
};

// generate AI summary
const generateAiSummary = async (circle) => {
    if (typeof circle === "string") {
        circle = await getCircle(circle);
    }
    if (!circle) {
        return;
    }
    let circleText = getCircleText(circle, false, true);
    const summarySystemMessage =
        "You're a helpful assistant for a social networking platform for change makers and co-creators.";
    let message = "";
    if (circle.type === "user" || circle.type === "ai_agent") {
        message = `In a single sentence, generate an expressive summary in the form of symbolic, poetic, and/or abstract phrase that captures the essence of the ${circle.type}, providing a deeper or more artistic representation rather than a direct summary. Do this without including the ${circle.type}'s name as it will already be displayed, and ensure the essential expression is under 200 characters: \n\n${circleText}`;
    } else {
        message = `In a single sentence, generate a concise summary of the ${circle.type}. The summary should be 200 characters max, and without including the ${circle.type}'s name as it will already be displayed before the summary.\n\n${circleText}`;
    }
    let summaryResponse = await getAiResponse(message, summarySystemMessage);
    if (summaryResponse?.responseMessage) {
        let summary = summaryResponse.responseMessage.content;
        if (summary) {
            if (summary.length > 250) {
                //console.log("Too long summary: " + summary);
                message = `The summary you provided is too long. Please please make it a bit more concise.`;
                let newSummary = await getNextAiResponse(summaryResponse.messages, message)?.responseMessage?.content;
                if (!newSummary) {
                    // truncate summary
                    summary = summary.substring(0, 200) + "...";
                } else {
                    summary = newSummary;
                }

                //console.log("Condensed summary: " + summary);
            }

            // remove eventual quotes from summary
            if (summary.startsWith('"') && summary.endsWith('"')) {
                summary = summary.slice(1, -1);
            }

            await updateCircle(circle.id, { description: summary });
        }
    }
};

// updates or inserts circle_data
const upsertCircleData = async (authCallerId, circleDataReq) => {
    let circleData = {};
    let errors = {};

    // check if user is owner or admin and allowed to update circle data
    const isAuthorized = await isAdminOf(authCallerId, circleDataReq.id);
    if (!isAuthorized) {
        errors.circle = "User is not authorized to update circle";
        return { errors };
    }

    if (!circleDataReq) {
        return circleData;
    }

    if (circleDataReq.email) {
        circleData.email = circleDataReq.email;
    }
    if (circleDataReq.agreed_to_tnc) {
        console.log("Updating agreed_to_tnc");
        circleData.agreed_to_tnc = new Date();
    }
    if (circleDataReq.agreed_to_email_updates) {
        circleData.agreed_to_email_updates = circleDataReq.agreed_to_email_updates;
    }
    if (circleDataReq.completed_guide) {
        circleData.completed_guide = new Date();
    }
    if (circleDataReq.skipped_setting_location !== undefined) {
        circleData.skipped_setting_location = circleDataReq.skipped_setting_location;
    }
    if (circleDataReq.incognito !== undefined) {
        circleData.incognito = circleDataReq.incognito;
    }
    if (circleDataReq.ai) {
        if (circleDataReq.ai.system_message) {
            circleData.ai = { system_message: circleDataReq.ai.system_message };
        }
    }

    if (Object.keys(circleData).length > 0) {
        db.collection("circle_data").doc(circleDataReq.id).set(circleData, { merge: true });
    }

    return circleData;
};

// create circle
app.post("/circles", auth, async (req, res) => {
    const authCallerId = req.user.user_id;

    try {
        if (req.body.id) {
            return res.json({ error: "Circle id must not be set" });
        }

        //  create circle
        let circle = await upsertCircle(authCallerId, req.body);
        if (circle.errors) {
            return res.json({ errors: circle.errors });
        }

        return res.json({ message: "Circle created", circle: circle });
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

        // update circle
        let circle = await upsertCircle(authCallerId, {
            id: circleId,
            ...req.body.circleData,
        });
        if (circle.errors) {
            return res.json({ errors: circle.errors });
        }

        // update circle data
        if (req.body.circlePrivateData) {
            let circleData = await upsertCircleData(authCallerId, {
                id: circleId,
                ...req.body.circlePrivateData,
            });
            if (circleData.errors) {
                return res.json({ errors: circleData.errors });
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

// update circle chunks
app.put("/circles/:id/chunks", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;
    const chunks = req.body.chunks;

    try {
        const circleRef = db.collection("circles").doc(circleId);
        const doc = await circleRef.get();
        if (!doc.exists) {
            return res.json({ error: "circle not found" });
        }
        const circle = doc.data();
        circle.id = doc.id;

        // check if user is owner or admin and allowed to update circle data
        const isAuthorized = await isAdminOf(authCallerId, circleId);
        if (!isAuthorized) {
            return res.json({
                error: "circle chunks only be updated by owner or admin",
            });
        }

        // get existing chunks from firestore
        const chunksRef = circleRef.collection("chunks");
        const snapshots = await chunksRef.get();
        const chunkIdsToDelete = snapshots.docs.map((doc) => "circles/" + circle.id + "/chunks/" + doc.id);

        // delete chunks from pinecone using fetched IDs
        if (chunkIdsToDelete.length > 0) {
            try {
                let pineconeService = await getPinecone();
                const index = pineconeService.Index("circles");
                await index.delete1({ ids: chunkIdsToDelete });
            } catch (error) {
                console.log(error);
                return res.json({ error: error });
            }
        }

        // delete chunks from firestore
        const batch = db.batch();
        snapshots.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // upload new chunks to firestore
        for (let chunk of chunks) {
            chunk.type = circle.type;
            chunk.parent_id = circleId;

            const chunkDoc = await chunksRef.add(chunk);
            const chunkId = chunkDoc.id;
            chunk.id = chunkId;
        }

        // upload new embeddings for chunks to pinecone
        let upsertResponse = await upsertCircleChunksEmbeddings(chunks, circle);
        if (upsertResponse.error) {
            functions.logger.error("Error while updating circle chunks data:", upsertResponse.error);
            return res.json({ error: upsertResponse.error });
        }

        return res.json({ message: "circle chunks updated" });
    } catch (error) {
        functions.logger.error("Error while updating circle chunks data:", error);
        return res.json({ error: error });
    }
});

// post circle comment
app.post("/circles/:id/comments", auth, async (req, res) => {
    try {
        const date = new Date();
        var circleId = req.params.id;
        var comment = DOMPurify.sanitize(req.body.comment);
        var parent_comment_id = req.body.parent_comment_id;

        const authCallerId = req.user.user_id;

        // validate request
        let errors = validateCommentRequest(comment);
        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }

        // user is allowed to post comment if the parent circle is public or user is member of circle
        let circle = await getCircle(circleId);
        if (!circle) {
            return res.json({ error: "circle not found" });
        }

        if (circle.type !== "post") {
            // for now comments can only be posted on posts
            return res.json({ error: "comments can only be posted on posts" });
        }

        let parentCircleId = circle.parent_circle?.id;
        if (parentCircleId) {
            let parentCircle = await getCircle(parentCircleId);
            if (!parentCircle.is_public) {
                let isAuthorized = await isMemberOf(authCallerId, parentCircle.id);
                if (!isAuthorized) {
                    return res.status(403).json({ error: "unauthorized" });
                }
            }
        } else {
            // parent circle is global and thus public
        }

        const user = await getCircle(authCallerId);
        const newComment = {
            circle_id: circleId,
            creator: user,
            created_at: date,
            content: comment,
        };
        if (parent_comment_id) {
            newComment.parent_comment_id = parent_comment_id;
            newComment.is_root = false;
        } else {
            newComment.is_root = true;
        }
        newComment.parent_circle_id = parentCircleId ?? "global";

        // does comment contain links?
        let links = linkify.match(comment);
        if (links) {
            // check if link points to circle
            let circleIds = [];
            for (var link of links) {
                let circleId = extractCircleId(link.url);
                if (circleId) {
                    circleIds.push(circleId);
                    // remove link from links
                    let linkUrl = link.url;
                    links = links.filter((x) => x.url !== linkUrl);
                }
            }
            if (circleIds.length > 0) {
                // get mentions
                let mentions = await getCirclesFromIds(circleIds);
                if (mentions) {
                    newComment.mentions = mentions;
                    newComment.has_mentions = true;
                }
            }
            if (links?.length > 0) {
                newComment.has_links = true;
            }
        }

        const commentRef = db.collection("comments").doc();
        await commentRef.set(newComment);

        // update number of comments in circle, highlighted comment and comment user preview list
        const circleRef = db.collection("circles").doc(circleId);
        let circleData = { comments: admin.firestore.FieldValue.increment(1) };
        if (!circle.highlighted_comment) {
            circleData.highlighted_comment = { id: commentRef.id, ...newComment };
        }

        let commenters_preview_list = circle.commenters_preview_list ?? [];
        let previewListUpdated = false;

        // add user to like preview list unless already there or length is greater than max_preview_likes
        let max_preview_commenters = 15;
        if (
            !commenters_preview_list.some((x) => x.id === user.id) &&
            commenters_preview_list.length < max_preview_commenters
        ) {
            let commenting_user = { id: user.id, name: user.name };
            if (commenting_user.picture) {
                commenting_user.picture = user.picture;
            }
            commenters_preview_list.push(commenting_user);
            previewListUpdated = true;
        }

        if (previewListUpdated) {
            circleData.commenters_preview_list = commenters_preview_list;
        }

        await circleRef.update(circleData);

        // propagate changes?
        // updateCircle(circleId, updatedCircle, false); // TODO we should avoid calling this with propagate updates as it will trigger a lot of updates

        // check if comment contains links and add preview images
        addPreviewImages(commentRef, links);

        // TODO send notification to users mentioned in comment and to user this comment replies to
        // getMemberConnections(circleId).then((memberConnections) => {
        //     for (var memberConnection of memberConnections) {
        //         if (memberConnection.target.id === authCallerId || memberConnection.target.type !== "user") {
        //             // ignore notifying sender and non-users
        //             continue;
        //         }
        //         sendMessageNotification(memberConnection.target, circle, newMessage, previewImage, "Chat");
        //     }
        // });

        return res.json({ message: "Comment created" });
    } catch (error) {
        functions.logger.error("Error while trying to add comment:", error);
        return res.json({ error: error });
    }
});

// update circle comment
app.put("/comments/:id", auth, async (req, res) => {
    const date = new Date();
    var commentId = req.params.id;
    var editedComment = DOMPurify.sanitize(req.body.comment);
    var authCallerId = req.user.user_id;

    try {
        const comment = await getComment(commentId);
        if (!comment) {
            return res.json({ error: "comment not found" });
        }
        if (comment.creator.id !== authCallerId) {
            return res.json({
                error: "comment can only be edited by owner",
            });
        }
        // validate request
        let errors = validateCommentRequest(editedComment);
        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }
        const editedCommentObj = {
            edited_at: date,
            content: editedComment,
        };
        // does message contain links?
        let links = linkify.match(editedComment);
        if (links) {
            editedCommentObj.has_links = true;
        }

        // update comment
        await updateComment(commentId, editedCommentObj);

        // check if comment contains link and add preview image
        const commentRef = db.collection("comments").doc(commentId);
        addPreviewImages(commentRef, links);
        return res.json({ message: "comment updated" });
    } catch (error) {
        functions.logger.error("Error while updating comment:", error);
        return res.json({ error: error });
    }
});

const updateHighlightedComment = async (circleId) => {
    // get earliest comment with highest like count
    let highlightedComment = null;
    let comments = await db
        .collection("comments")
        .where("circle_id", "==", circleId)
        .where("is_root", "==", true)
        .orderBy("likes", "desc")
        .orderBy("created_at", "asc")
        .limit(1)
        .get();
    if (comments.docs.length > 0) {
        highlightedComment = comments.docs[0].data();
        highlightedComment.id = comments.docs[0].id;
    }

    // update circle with highlighted comment
    const circleRef = db.collection("circles").doc(circleId);
    let circleData = {};
    if (highlightedComment) {
        circleData.highlighted_comment = highlightedComment;
    } else {
        circleData.highlighted_comment = admin.firestore.FieldValue.delete();
    }

    await circleRef.update(circleData);
};

// delete circle comment
app.delete("/comments/:id", auth, async (req, res) => {
    const commentId = req.params.id;
    const authCallerId = req.user.user_id;
    try {
        const comment = await getComment(commentId);
        if (!comment) {
            return res.json({ error: "comment not found" });
        }
        if (comment.creator.id !== authCallerId) {
            return res.json({
                error: "comment can only be deleted by owner",
            });
        }

        // see if it has any child comments
        let childComments = await db.collection("comments").where("parent_comment_id", "==", commentId).get();
        if (childComments.docs.length > 0) {
            // mark comment as deleted and erase content
            await updateComment(commentId, { deleted_at: new Date(), content: "", creator: {} });
        } else {
            // delete comment
            const commentRef = db.collection("comments").doc(commentId);

            // delete chat message
            await commentRef.delete();
        }

        // update number of comments in circle, highlighted comment and comment user preview list
        let circleId = comment.circle_id;
        let circle = await getCircle(circleId);
        let circleData = { comments: admin.firestore.FieldValue.increment(-1) };

        let commenters_preview_list = circle.commenters_preview_list ?? [];
        let previewListUpdated = false;

        // remove user from commenters preview list if they are in it and there are no other comments from user
        let userComments = await db.collection("comments").where("creator.id", "==", authCallerId).get();
        if (userComments.docs.length <= 0 && commenters_preview_list.some((x) => x.id === authCallerId)) {
            commenters_preview_list = commenters_preview_list.filter((x) => x.id !== authCallerId);
            previewListUpdated = true;
        }

        if (previewListUpdated) {
            circleData.commenters_preview_list = commenters_preview_list;
        }

        const circleRef = db.collection("circles").doc(circleId);
        await circleRef.update(circleData);

        await updateHighlightedComment(circleId);

        return res.json({ message: "comment deleted" });
    } catch (error) {
        functions.logger.error("Error while deleting comment:", error);
        return res.json({ error: error });
    }
});

// get circles relevant to circle
app.get("/circles/:id/circles", async (req, res) => {
    const circleId = req.params.id;
    const filter = req.query.filter;
    const noFilter = !filter || filter.length <= 0;
    // console.log("*************************" + JSON.stringify(filter));

    try {
        // TODO when filtering for a specific category and type we can make the semantic search more specific to that as to yield more relevant results

        // get similar circles through semantic search
        let similarCircles = [];
        if (noFilter || filter.includes("similar")) {
            try {
                similarCircles = await semanticSearch(null, circleId, ["circle"], 7);
                similarCircles = similarCircles.concat(await semanticSearch(null, circleId, ["user"], 7));
                similarCircles = similarCircles.concat(
                    await semanticSearch(null, circleId, ["event", "project", "document"], 7)
                );
            } catch (error) {
                functions.logger.error("Error while getting similar circles:", error);
            }

            // remove circle itself from similar circles
            similarCircles = similarCircles.filter((x) => x.id !== circleId);

            // TODO similar circles can be cached per circleId and updated periodically
        }

        let connectedCircles = [];
        if (noFilter || filter.includes("connected")) {
            // get circles connected to circle
            const connections = await getRelevantConnections(circleId);

            // get up to date circle data for connections
            let circleIds = connections.filter((x) => x.target.type !== "tag").map((x) => x.target.id);

            while (circleIds.length) {
                let circleIdsBatch = circleIds.splice(0, 10);
                let circleDocs = await db
                    .collection("circles")
                    .where(admin.firestore.FieldPath.documentId(), "in", circleIdsBatch)
                    .get();
                for (let i = 0; i < circleDocs.docs.length; i++) {
                    let circle = {
                        id: circleDocs.docs[i].id,
                        ...circleDocs.docs[i].data(),
                    };
                    connectedCircles.push(circle);
                }
            }
        }

        let mentionedCircles = [];
        if (noFilter || filter.includes("mentioned")) {
            // get circles mentioned in circle
            // get latest chat_messages in circle and extract mentioned circles

            let chatMessages = await db
                .collection("chat_messages")
                .where("circle_id", "==", circleId)
                .where("has_mentions", "==", true)
                .orderBy("sent_at", "desc")
                .limit(10)
                .get();
            for (let i = 0; i < chatMessages.docs.length; i++) {
                let chatMessage = chatMessages.docs[i].data();
                let mentions = chatMessage.mentions;

                // add to mentioned circles or update existing circle with chatMessage date
                for (let j = 0; j < mentions.length; j++) {
                    let mention = mentions[j];

                    // check if circle is already in mentioned circles
                    let mentionedCircle = mentionedCircles.find((x) => x.id === mention.id);
                    if (mentionedCircle) {
                        // update last mentioned date
                        if (chatMessage.sent_at > mentionedCircle.mentioned_at) {
                            mentionedCircle.mentioned_at = chatMessage.sent_at;
                        }
                    } else {
                        // add to mentioned circles
                        mention.mentioned_at = chatMessage.sent_at;
                        mentionedCircles.push(mention);
                    }
                }
            }
        }

        return res.json({
            similarCircles: similarCircles,
            connectedCircles: connectedCircles,
            mentionedCircles: mentionedCircles,
        });
    } catch (error) {
        functions.logger.error("Error while getting circles:", error);
        return res.json({ error: error });
    }
});

// get users that has liked circle
app.get("/circles/:id/likes", async (req, res) => {
    const circleId = req.params.id;
    const likedUsersData = [];

    try {
        // query all circle_data where the target circle is liked
        const circleDataQuerySnapshot = await db
            .collection("circle_data")
            .where(`circle_settings.${circleId}.liked`, "==", true)
            .get();

        // for each liked circle_data, get the public data from circles
        for (const doc of circleDataQuerySnapshot.docs) {
            const publicDataDoc = await db.collection("circles").doc(doc.id).get();
            if (publicDataDoc.exists) {
                // Add public data of the user to the array
                likedUsersData.push({ id: doc.id, ...publicDataDoc.data() });
            }
        }

        // send the public data of users who liked the circle
        res.status(200).json({ likes: likedUsersData });
    } catch (error) {
        console.error("Error getting liked users: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// gets zoom credentials for circle
app.get("/circles/:id/zoom-credentials", authOptional, async (req, res) => {
    functions.logger.log("Fetching zoom credentials");
    console.log("Fetching zoom credentials");

    const circleId = req.params.id;
    const authCallerId = req.user?.user_id;

    try {
        // see if user is admin of circle
        const circle = await getCircle(circleId);
        if (!circle) {
            return res.json({ error: "circle not found" });
        }
        const isAdmin = authCallerId ? await isAdminOf(authCallerId, circleId) : false;

        const role = 0; //isAdmin ? 1 : 0; // 1 for host, 0 for attendee
        let userName = "Anonymous";
        let userEmail = null;

        if (authCallerId) {
            const user = await getCircle(authCallerId);
            const userData = await getCircleData(authCallerId);
            userName = user.name;
            userEmail = userData.email;
        }

        // get meeting number and passcode
        let circleData = await getCircleData(circleId);
        let meetingNumber = circleData?.zoom_meeting_number;
        let passWord = circleData?.zoom_passcode;

        //let meetingNumber = circle.zoom_meeting_number;

        if (!meetingNumber) {
            // TODO create new zoom meeting
            // meetingNumber = await createZoomMeeting(circle);
            return res.json({ error: "no zoom meeting room set up" });
        }

        const apiKey = process.env.ZOOM_SDK_KEY;
        const secret = process.env.ZOOM_SDK_SECRET;

        let signature = generateZoomToken(apiKey, secret, meetingNumber, role);

        return res.json({
            signature,
            apiKey,
            meetingNumber,
            userName,
            userEmail,
            passWord,
        });
    } catch (error) {
        functions.logger.error("Error while getting zoom credentials:", error);
        return res.json({ error: error });
    }
});

// initialize set circles
app.post("/circles/init_sets", auth, async (req, res) => {
    const circleIds = req.body.circle_ids;
    const authCallerId = req.user.user_id;

    try {
        for (const circleId of circleIds) {
            await createSet(circleId, authCallerId);
        }
        return res.json({ message: "circle sets initialized" });
    } catch (error) {
        functions.logger.error("Error while initializing sets:", error);
        return res.json({ error: error });
    }
});

// initialize set circle
app.post("/circles/:id/init_set", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;

    try {
        let set = await createSet(circleId, authCallerId);
        return res.json({ circle: set });
    } catch (error) {
        functions.logger.error("Error while initializing set:", error);
        return res.json({ error: error });
    }
});

// update circle activity status
app.put("/circles/:id/activity", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;

    try {
        const circleRef = db.collection("circles").doc(circleId);
        const doc = await circleRef.get();
        if (!doc.exists) {
            return res.json({ error: "circle not found" });
        }

        // update circle data
        var circleData = {};
        circleData.activity = { last_activity: new Date() };

        if (circleId === authCallerId) {
            // user is updating their own activity status
            circleData.activity.last_online = new Date();
            circleData.activity.active_in_video_conference = req.body.active_in_video_conference ? new Date() : false;
            if (req.body.timezone) {
                //const user = doc.data();
                circleData.activity.timezone = req.body.timezone;
                // store timezone in circle_data as well
                const circleDataRef = db.collection("circle_data").doc(circleId);
                await circleDataRef.set(
                    {
                        timezone: req.body.timezone,
                    },
                    { merge: true }
                );
                //circleData.timezone = req.body.timezone;
            }
            let activeInCircle = req.body.active_in_circle;
            if (activeInCircle) {
                activeInCircle.activity = {}; // to avoid recursion
            }
            circleData.activity.active_in_circle = activeInCircle ?? false;
            if (req.body.location) {
                circleData.activity.location = req.body.location;
            }
        } else {
            // user is visiting a circle and updating its activity status
            if (req.body.active_in_video_conference) {
                circleData.activity.active_video_conference = new Date();
            }
        }

        // update circle
        await updateCircle(circleId, circleData, false, true);
        return res.json({ message: "circle activity updated" });
    } catch (error) {
        functions.logger.error("Error while updating circle activity data:", error);
        return res.json({ error: error });
    }
});

// delete circle activity status
app.delete("/circles/:id/activity", auth, async (req, res) => {
    const circleId = req.params.id;
    const authCallerId = req.user.user_id;

    try {
        const circleRef = db.collection("circles").doc(circleId);
        const doc = await circleRef.get();
        if (!doc.exists) {
            return res.json({ error: "circle not found" });
        }

        if (circleId !== authCallerId) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // update circle data
        var circleData = { activity: admin.firestore.FieldValue.delete() };

        // update circle
        await updateCircle(circleId, circleData, false, true);
        return res.json({ message: "circle activity updated" });
    } catch (error) {
        functions.logger.error("Error while updating circle activity data:", error);
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
            let connection = await getConnectionWithType(targetId, sourceId, "connected_mutually_to_request");
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
                    targetCircleData?.is_public ||
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
            let connection = await getConnectionWithType(sourceId, targetId, "admin_by");
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
    if (
        type !== "connected_to" &&
        type !== "connected_mutually_to" &&
        type !== "connected_mutually_to_request" &&
        type !== "admin_by_request"
    ) {
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
    const connectionType = req.body.connectionType;
    const date = new Date();

    try {
        let connection = await getConnectionById(connectionId);
        if (!connection || !connection.types.includes(connectionType)) {
            return res.json({ error: "connection-request-not-found" });
        }

        // verify user is allowed to approve connections to target
        let isAuthorized = await isAdminOf(authCallerId, connection.target.id);
        if (!isAuthorized) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // update notifications
        const notificationsDocs = await db
            .collection("notifications")
            .where("connection_id", "==", connectionId)
            .where("connection_type", "==", connectionType)
            .get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({
                request_status: "approved",
                request_updated_at: date,
            });
        });

        // remove request
        await deleteConnection(connection.source, connection.target, connectionType, false);

        // create mutual connection between source and target
        await createConnection(connection.source.id, connection.target.id, "connected_mutually_to");
        await createConnection(connection.target.id, connection.source.id, "connected_mutually_to", true, authCallerId);

        if (connectionType === "admin_by_request") {
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
    const connectionType = req.body.connectionType;
    const date = new Date();

    try {
        let connection = await getConnectionById(connectionId);
        if (!connection || !connection.types.includes(connectionType)) {
            return res.json({ error: "connection-request-not-found" });
        }

        // verify user is allowed to deny connections to target
        let isAuthorized = await isAdminOf(authCallerId, connection.target.id);
        if (!isAuthorized) {
            return res.status(403).json({ error: "unauthorized" });
        }

        // update notifications
        const notificationsDocs = await db
            .collection("notifications")
            .where("connection_id", "==", connectionId)
            .where("connection_type", "==", connectionType)
            .get();
        notificationsDocs.forEach(async (notificationDoc) => {
            const docRef = db.collection("notifications").doc(notificationDoc.id);
            await docRef.update({
                request_status: "denied",
                request_updated_at: date,
            });
        });

        // remove request
        await deleteConnection(connection.source, connection.target, connectionType);

        return res.json({ message: "Connection request denied" });
    } catch (err) {
        functions.logger.error("Error approving connection request:", err);
    }
});

const getSettingsCircle = (circle) => {
    let settingsCircle = {
        id: circle.id,
    }; // store basic info about circle
    if (circle.name) {
        settingsCircle.name = circle.name;
    }
    if (circle.type) {
        settingsCircle.type = circle.type;
    }
    if (circle.picture) {
        settingsCircle.picture = circle.picture;
    }
    if (circle.cover) {
        settingsCircle.cover = circle.cover;
    }
    if (circle.base) {
        settingsCircle.base = circle.base;
    }
    if (circle.calculated_map_viewport) {
        settingsCircle.calculated_map_viewport = circle.calculated_map_viewport;
    }
    if (circle.custom_map_viewport) {
        settingsCircle.custom_map_viewport = circle.custom_map_viewport;
    }

    return settingsCircle;
};

// update circle settings
const updateCircleSettings = async (authCallerId, circleId, targetCircleId, settings, checkAuth = true) => {
    let favoriteSet = false;
    let likedSet = false;
    let newSettings = {};
    if (settings.notifications) {
        newSettings.notifications = settings.notifications;
    }
    if (typeof settings.favorite === "boolean") {
        newSettings.favorite = settings.favorite;
        favoriteSet = true;
    }
    if (typeof settings.liked === "boolean") {
        newSettings.liked = settings.liked;
        likedSet = true;
    }

    // console.log(JSON.stringify(newSettings, null, 2));

    if (Object.keys(newSettings).length === 0) {
        return { error: "Invalid input" };
    }

    let user = await getCircle(authCallerId);
    let circle = await getCircle(targetCircleId);
    newSettings.circle = getSettingsCircle(circle);

    // verify user is authorized to change settings
    if (checkAuth) {
        const isAuthorized = await isAdminOf(authCallerId, circleId);
        if (!isAuthorized) {
            return { error: "unauthorized" };
        }
    }

    // get circle data
    let circleData = await getCircleData(circleId);

    // update setting for circle, this could be turning notifications on/off, adding circle as favorite, etc.
    const userDataRef = db.collection("circle_data").doc(circleId);

    let circle_settings = {
        [targetCircleId]: newSettings,
    };

    await userDataRef.set(
        {
            circle_settings,
        },
        { merge: true }
    );

    // update target circle like and favorite count
    let likeFavoriteData = {};
    if (favoriteSet) {
        let previousFavorite = circleData?.circle_settings?.[targetCircleId]?.favorite;
        if (previousFavorite !== settings.favorite) {
            likeFavoriteData.favorites = settings.favorite
                ? admin.firestore.FieldValue.increment(1)
                : admin.firestore.FieldValue.increment(-1);
        }
    }
    if (likedSet) {
        let previousLiked = circleData?.circle_settings?.[targetCircleId]?.liked;
        if (previousLiked !== settings.liked) {
            likeFavoriteData.likes = settings.liked
                ? admin.firestore.FieldValue.increment(1)
                : admin.firestore.FieldValue.increment(-1);

            let liking_user = { id: user.id, name: user.name };
            if (user.picture) {
                liking_user.picture = user.picture;
            }

            let like_preview_list = circle.like_preview_list ?? [];
            let likePreviewUpdated = false;
            if (settings.liked) {
                // add user to like preview list unless already there or length is greater than max_preview_likes
                let max_preview_likes = 15;
                if (!like_preview_list.some((x) => x.id === user.id) && like_preview_list.length < max_preview_likes) {
                    like_preview_list.push(liking_user);
                    likePreviewUpdated = true;
                }
            } else if (like_preview_list.some((x) => x.id === user.id)) {
                like_preview_list = like_preview_list.filter((x) => x.id !== user.id);
                likePreviewUpdated = true;
            }

            if (likePreviewUpdated) {
                likeFavoriteData.like_preview_list = like_preview_list;
            }
        }
    }

    if (Object.keys(newSettings).length > 0) {
        // update target circle like and favorite count
        // const targetCircleRef = db.collection("circles").doc(targetCircleId);
        // await targetCircleRef.set(likeFavoriteData, { merge: true });
        await updateCircle(targetCircleId, likeFavoriteData);
    }

    return { message: "Ok" };
};

// update circle settings for circle
app.post("/circles/:id/settings", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.params.id;
    const targetCircleId = req.body.circleId;
    const settings = req.body.settings;

    let result = await updateCircleSettings(authCallerId, circleId, targetCircleId, settings, true);
    return res.json(result);
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
            user.isNew = true;
        } else {
            user = { ...doc.data(), id: authCallerId };
        }

        let userData = await getCircleData(authCallerId);
        let userRet = { user: user, userData: userData };

        // generate jwt token for jitsi
        const token = generateJitsiToken(process.env.JITSI_API_KEY, {
            // Pass your generated private key
            id: user.id,
            name: user.name, // Set the user name
            email: userData.email, // Set the user email
            avatar: user.picture, // Set the user avatar
            appId: "codo", // Your AppID
            domain: process.env.JITSI_DOMAIN,
            kid: "codo",
        });
        userRet.jitsiToken = token;

        return res.json(userRet);
    } catch (error) {
        functions.logger.error("Error signing in:", error);
        return res.json({ error: error });
    }
});

app.post("/registerOneSignalUserId", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const userId = req.body.userId;

    if (!userId) {
        return res.json({ error: "Invalid input" });
    }

    try {
        const userData = await getCircleData(authCallerId);

        let oneSignalIds = userData.onesignal_ids ?? [];
        if (oneSignalIds.some((x) => x.user_id === userId)) {
            // update updated_at
            oneSignalIds = oneSignalIds.map((x) => {
                if (x.user_id === userId) {
                    x.updated_at = new Date();
                }
                return x;
            });
        } else {
            // add new one signal id
            let created_at = new Date();
            oneSignalIds.push({
                user_id: userId,
                created_at: created_at,
                updated_at: created_at,
            });
        }

        const circleRef = db.collection("circle_data").doc(authCallerId);
        await circleRef.update({ onesignal_ids: oneSignalIds });

        return res.json({ message: "Ok" });
    } catch (error) {
        functions.logger.error("Error setting message one OneSignal user id:", error);
        return res.json({ error: error });
    }
});

app.post("/seen", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.body.circleId;
    const category = req.body.category;

    if (!circleId) {
        return res.json({ error: "Invalid input" });
    }

    await setUserSeen(authCallerId, circleId, category);

    return res.json({ message: "Ok" });
});

//#endregion

//#region chat

const validateChatMessageRequest = (message) => {
    // validate request
    let errors = {};
    if (!message || typeof message !== "string" || message.length > 6500) {
        errors.message = "Message must be between 1 and 6500 characters";
    }
    return errors;
};

// create chat session
app.post("/chat_session", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.body.circle_id;
    const triggerAi = req.body.trigger_ai;
    const date = new Date();

    try {
        const circle = await getCircle(circleId);
        if (!circle) {
            return res.json({ error: "circle not found" });
        }

        // verify user is allowed to create chat session
        let isAiRelationSet =
            circle.type === "set" &&
            (circle[circle?.circle_ids?.[0]]?.type === "ai_agent" ||
                circle[circle?.circle_ids?.[1]]?.type === "ai_agent");
        if (isAiRelationSet) {
            if (!circle.circle_ids?.includes(authCallerId)) {
                return res.status(403).json({ error: "unauthorized" });
            }
        } else {
            // TODO for now only users chatting with AI are allowed to create chat sessions
            return res.status(403).json({ error: "unauthorized" });
            // let isAuthorized = await isMemberOf(authCallerId, circleId);
            // if (!isAuthorized) {
            //     return res.status(403).json({ error: "unauthorized" });
            // }
        }

        const chatRef = db.collection("chat").doc(circleId);

        // check if chat exists
        const doc = await chatRef.get();
        let sessionId = uuid();
        if (doc.exists) {
            // create new session within chat
            let sessions = doc.data().sessions;
            let newSession = {
                id: sessionId,
                created_at: date,
                user_id: authCallerId,
            };
            sessions.push(newSession);
            await chatRef.update({ sessions: sessions });
        } else {
            let newChat = {
                circle_id: circleId,
                created_at: date,
                sessions: [
                    {
                        id: sessionId,
                        created_at: date,
                        user_id: authCallerId,
                    },
                ],
            };

            await chatRef.set(newChat);
        }

        // trigger AI to initiate conversation in chat session if not already done
        if (isAiRelationSet) {
            // get ai circle
            let agentCircleId = circle.circle_ids.find((x) => x !== authCallerId);
            let agentCircleData = await getCircleData(agentCircleId);

            // see if initial prompt has been sent
            let setCircleData = await getCircleData(circleId);
            if (!setCircleData?.initial_prompt_sent) {
                // add initial prompt
                triggerAiAgentResponse(
                    circle,
                    authCallerId,
                    sessionId,
                    agentCircleData?.ai?.initial_prompt ?? "Give a short welcome message"
                );

                // set initial prompt sent
                // const circleDataRef = db.collection("circle_data").doc(circleId);
                // await circleDataRef.set(
                //     {
                //         initial_prompt_sent: true,
                //     },
                //     { merge: true }
                // );
            }
        }

        return res.json({ message: "Chat session created", id: sessionId });
    } catch (error) {
        functions.logger.error("Error while creating chat session:", error);
        return res.json({ error: error });
    }
});

const extractCircleId = (url) => {
    const regex = /.*codo\.earth\/circles\/([^\/?]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// post chat message
app.post("/chat_messages", auth, async (req, res) => {
    try {
        const date = new Date();
        var circleId = req.body.circle_id;
        var message = DOMPurify.sanitize(req.body.message);
        var replyToId = req.body.replyToId;
        const authCallerId = req.user.user_id;
        const session_id = req.body.session_id;

        // validate request
        let errors = validateChatMessageRequest(message);
        if (Object.keys(errors).length !== 0) {
            return res.json(errors);
        }

        // verify user is allowed to post chat messages
        let circle = await getCircle(circleId);
        let aiChatSession =
            circle?.type === "set" &&
            (circle[circle?.circle_ids?.[0]]?.type === "ai_agent" ||
                circle[circle?.circle_ids?.[1]]?.type === "ai_agent");
        if (!circle) {
            return res.json({ error: "circle not found" });
        }

        if (!circle.is_public) {
            if (circle.type === "set") {
                if (!circle.circle_ids?.includes(authCallerId)) {
                    return res.status(403).json({ error: "unauthorized" });
                }
            } else {
                let isAuthorized = await isMemberOf(authCallerId, circleId);
                if (!isAuthorized) {
                    return res.status(403).json({ error: "unauthorized" });
                }
            }
        }

        const user = await getCircle(authCallerId);
        const newMessage = {
            circle_id: circleId,
            user,
            sent_at: date,
            message: message,
        };
        if (session_id) {
            newMessage.session_id = session_id;
        }

        if (replyToId) {
            // sanitize
            let replyToMessage = await getChatMessage(replyToId);
            if (!replyToMessage) {
                return res.json({ error: "Couldn't find message to reply to" });
            }
            newMessage.reply_to = replyToMessage;
        }

        // is the message an AI prompt?
        if (!aiChatSession && (message.startsWith("/ai") || message.startsWith("/AI"))) {
            newMessage.message = message.substring(3).trim();
            newMessage.is_ai_prompt = true;
        }

        // does message contain links?
        let links = linkify.match(message);
        if (links) {
            // check if link points to circle
            let circleIds = [];
            for (var link of links) {
                let circleId = extractCircleId(link.url);
                if (circleId) {
                    circleIds.push(circleId);

                    // remove link from links
                    let linkUrl = link.url;
                    links = links.filter((x) => x.url !== linkUrl);
                }
            }

            if (circleIds.length > 0) {
                // get mentions
                let mentions = await getCirclesFromIds(circleIds);
                if (mentions) {
                    newMessage.mentions = mentions;
                    newMessage.has_mentions = true;
                }
            }
            if (links?.length > 0) {
                newMessage.has_links = true;
            }
        }

        //console.log("message contains links: " + newMessage.has_links);

        const chatMessageRef = db.collection("chat_messages").doc();
        await chatMessageRef.set(newMessage);

        // add update to circle that new chat message has been sent
        let updatedCircle = {
            updates: {
                any: date,
                chat: date,
            },
            messages: admin.firestore.FieldValue.increment(1),
        };
        // update circle and propagate changes
        updateCircle(circleId, updatedCircle, false); // TODO we should avoid calling this with propagate updates as it will trigger a lot of updates

        // update user that chat message has been seen
        setUserSeen(authCallerId, circleId, "chat");

        if (newMessage.is_ai_prompt) {
            // initiate AI prompt
            sendOpenAIPrompt(newMessage.message, 0.7, 500).then((x) => {
                // console.log("AI response: " + x.choices[0].text);
                if (x.choices?.[0]) {
                    x.choices[0].text = DOMPurify.sanitize(x.choices[0].text)?.trim();
                }
                // update message with AI response
                chatMessageRef.update({ openai_response: x });
            });
        }
        // check if message contains link and add preview image
        addPreviewImages(chatMessageRef, links).then((previewImage) => {
            if (circle.type === "set") {
                // send notification to users in set
                for (var circleId of circle.circle_ids) {
                    if (circleId === authCallerId) continue;

                    sendMessageNotification(circle[circleId], circle, newMessage, previewImage, "Chat");
                }
            } else {
                // send notification to all users connected to circle
                getMemberConnections(circleId).then((memberConnections) => {
                    for (var memberConnection of memberConnections) {
                        if (memberConnection.target.id === authCallerId || memberConnection.target.type !== "user") {
                            // ignore notifying sender and non-users
                            continue;
                        }
                        sendMessageNotification(memberConnection.target, circle, newMessage, previewImage, "Chat");
                    }
                });
            }
        });

        if (aiChatSession) {
            // trigger AI agent to respond
            triggerAiAgentResponse(circle, user, session_id);
        }

        //console.log("message sent", JSON.stringify(newMessage, null, 2));

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
            return res.json({
                error: "chat message can only be edited by owner",
            });
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
        let links = linkify.match(editedMessage);
        if (links) {
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
            return res.json({
                error: "chat message can only be deleted by owner",
            });
        }

        // delete chat message
        await deleteChatMessage(messageId);

        // add update to circle that new chat message has been sent
        let updatedCircle = {
            messages: admin.firestore.FieldValue.increment(-1),
        };
        // update circle and propagate changes
        updateCircle(message.circle_id, updatedCircle);

        return res.json({ message: "message deleted" });
    } catch (error) {
        functions.logger.error("Error while deleting chat message:", error);
        return res.json({ error: error });
    }
});

// check if message contains link and adds preview image
const addPreviewImages = async (docRef, links) => {
    if (!links) return null;

    let previewImage = null;
    // add preview images
    const metaData = [];
    for (const link of links) {
        let linkUrl = link.url;
        if (!link.schema) {
            linkUrl = "https://" + link.raw;
        } else {
            linkUrl = link.url;
        }
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

        if (linkPreview?.images?.length > 0) {
            previewImage = linkPreview.images[0];
        }
    }

    if (metaData.length > 0) {
        await docRef.update({ meta_data: metaData });
    }

    return previewImage;
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
                await notificationRef.update({
                    is_seen: true,
                    unread_messages: 0,
                });
            }
        } else {
            // set all chat notifications to user as read
            const notificationsDocs = await db
                .collection("chat_notifications")
                .where("user_id", "==", authCallerId)
                .where("is_seen", "==", false)
                .get();
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

//#endregion

//#region notifications

// update notifications (mark as read)
app.put("/notifications", auth, async (req, res) => {
    const authCallerId = req.user.user_id;

    try {
        // get all unread notifications for user
        const notificationsDocs = await db
            .collection("notifications")
            .where("user_id", "==", authCallerId)
            .where("is_read", "==", false)
            .get();
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

//#region Search

const getCirclesFromIds = async (circleIds) => {
    let circles = [];
    while (circleIds?.length) {
        let circleIdsBatch = circleIds.splice(0, 10);
        let circleDocs = await db
            .collection("circles")
            .where(admin.firestore.FieldPath.documentId(), "in", circleIdsBatch)
            .get();

        for (var i = 0; i < circleDocs.docs.length; ++i) {
            let circle = {
                id: circleDocs.docs[i].id,
                ...circleDocs.docs[i].data(),
            };
            circles.push(circle);
        }
    }
    return circles;
};

// do semantic search either by query or by circle id
const semanticSearch = async (
    query = null,
    circleId = null,
    filterTypes = null,
    topK = 20,
    parentIds = [],
    searchChunks = false
) => {
    let pineconeService = await getPinecone();
    const index = pineconeService.Index("circles");

    let pineconeRequest = { queryRequest: { topK: topK } };
    if (filterTypes) {
        pineconeRequest.queryRequest.filter = { type: { $in: filterTypes } };
        if (parentIds.length > 0) {
            pineconeRequest.queryRequest.filter.parent_id = { $in: parentIds };
        }
    }
    if (query) {
        // get embeddings from openai
        let embedding = await getEmbedding(query);
        if (!embedding) {
            return [];
        }
        pineconeRequest.queryRequest.vector = embedding;
    } else if (circleId) {
        pineconeRequest.queryRequest.id = circleId;
    } else {
        return [];
    }

    //console.log("pineconeRequest", JSON.stringify(pineconeRequest, null, 2));
    let pineconeResponse = await index.query(pineconeRequest);

    //console.log("pineconeResponse", JSON.stringify(pineconeResponse, null, 2));

    // get circle (or chunk) data from response
    let circleIds = pineconeResponse.matches.map((x) => x.id);
    let circles = [];
    while (circleIds.length) {
        let circleIdsBatch = circleIds.splice(0, 10);
        let circleDocs;

        if (searchChunks) {
            circleDocs = await db
                .collectionGroup("chunks")
                .where(admin.firestore.FieldPath.documentId(), "in", circleIdsBatch)
                .get();
        } else {
            circleDocs = await db
                .collection("circles")
                .where(admin.firestore.FieldPath.documentId(), "in", circleIdsBatch)
                .get();
        }

        // add score to circle or chunk
        for (var i = 0; i < circleDocs.docs.length; ++i) {
            let circle = {
                id: circleDocs.docs[i].id,
                ...circleDocs.docs[i].data(),
            };
            let match = pineconeResponse.matches.find((x) => x.id?.endsWith(circle.id)); // endsWith because chunks ends with the chunk id

            circle.score = match?.score;
            circles.push(circle);
        }
    }

    // order circles (or chunks) by score
    circles = circles.sort((a, b) => b.score - a.score);
    return circles;
};

const getSetId = (circleAId, circleBId) => {
    // sort the IDs
    const sortedIds = [circleAId, circleBId].sort();

    // concatenate the sorted IDs
    const combinedId = sortedIds.join("_");

    // hash the combined ID using sha256
    const setId = sha256(combinedId);
    return setId;
};

const createSet = async (circleAId, circleBId) => {
    const sortedIds = [circleAId, circleBId].sort();
    const setId = getSetId(circleAId, circleBId);

    let existingSet = await getCircle(setId);
    if (existingSet === null) {
        const circleA = await getCircle(circleAId);
        const circleB = await getCircle(circleBId);
        let set = {
            type: "set",
            created_at: new Date(),
            is_public: false,
            circle_ids: sortedIds,
            set_size: 2,
            circle_types: getCircleTypes(circleA, circleB),
            //need_update: true,
        };
        set[circleAId] = circleA;
        set[circleBId] = circleB;

        // add connected_mutually_to in set circle data
        const circleRef = db.collection("circles").doc(setId);
        await circleRef.set(set);
        existingSet = { id: setId, ...set };
    }

    // check if set has circle data
    const existingSetData = await getCircleData(setId);
    if (existingSetData === null) {
        // add set data
        const userDataRef = db.collection("circle_data").doc(setId);
        await userDataRef.set(
            {
                connected_mutually_to: admin.firestore.FieldValue.arrayUnion(circleAId, circleBId),
                circle_id: setId,
            },
            { merge: true }
        );
    }

    return existingSet;
};

const getSet = async (authCallerId, circleId, updateDescription) => {
    // get set data
    let setId = getSetId(authCallerId, circleId);
    let set = await getCircle(setId);
    if (set === null) {
        // create set
        set = createSet(authCallerId, circleId);
    }
    return set;
};

const getSets = async (authCallerId, circleIds, updateDescription) => {
    if (circleIds.length < 0) {
        return [];
    }

    // get set data
    let sets = [];
    for (var i = 0; i < circleIds.length; ++i) {
        let circleId = circleIds[i];
        let set = await getSet(authCallerId, circleId, updateDescription);
        sets.push(set);
    }
    return sets;
};

// do semantic search
app.post("/search", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const query = req.body.query;
    const circleId = req.body.circleId;
    const topK = req.body.topK ?? 10;
    const filterTypes = req.body.filterTypes ?? defaultSearchTypes;

    try {
        let searchResults = await semanticSearch(query, circleId ?? authCallerId, filterTypes, topK);
        return res.json({ circles: searchResults });
    } catch (error) {
        functions.logger.error("Error while searching:", error);
        return res.json({ error: error });
    }
});

//#endregion

//#region Relation

// post request to update relation description
app.post("/request_relation_update", auth, async (req, res) => {
    const authCallerId = req.user.user_id;
    const circleId = req.body.circleId;

    try {
        // get user data
        let userData = await getCircleData(authCallerId);
        if (!userData) {
            return res.json({ error: "User data not found" });
        }

        // get set id
        let setId = getSetId(authCallerId, circleId);

        // see if existing relation data exists
        let relationData = userData.circle_settings?.[setId]?.relation;
        if (relationData) {
            // TODO check if relation data is already up to date
            return res.json({
                message: "relation description already up to date",
            });
        }

        // prompt AI to find relation between circles
        let circleA = await getCircle(authCallerId);
        let circleB = await getCircle(circleId);
        let circleAText = getCircleText(circleA);
        let circleBText = getCircleText(circleB);

        let messages = [];
        messages.push({
            role: "system",
            content:
                "You are a helpful assistant helping users on a social media networking platform for change makers and co-creators. You help users find other users, organizations, projects and circles that are relevant to them and that can help them reach their goals.",
        });
        messages.push({
            role: "user",
            content: `In one short sentence describe how ${circleB.name} is relevant to me. If information is lacking simply say so.\n\nMy profile:\n${circleAText}\n\n${circleB.name} profile:\n${circleBText}`,
        });

        // initiate AI response
        const configuration = new Configuration({
            apiKey: process.env.OPENAI,
        });

        const openai = new OpenAIApi(configuration);
        let request = {
            messages,
            model: "gpt-4-1106-preview", // model GPT4 Turbo
        };

        let messageData = null;
        try {
            //console.log("Calling AI to get relation description");
            //console.log(`request ${functionCalls}: ${JSON.stringify(request, null, 2)}`);
            const response = await openai.createChatCompletion(request);
            messageData = response.data?.choices?.[0]?.message;
            //console.log("AI response", messageData);
        } catch (error) {
            console.log("error: ", error);
            return res.json({ error: error });
        }

        if (!messageData) {
            return res.json({ error: "No response from AI" });
        }

        // update profile with AI response
        const userDataRef = db.collection("circle_data").doc(authCallerId);
        let newSettings = {
            relation: {
                circle_id: circleId,
                updated_at: new Date(),
                description: messageData.content,
            },
        };

        let circle_settings = {
            [circleId]: newSettings,
        };

        await userDataRef.set(
            {
                circle_settings,
            },
            { merge: true }
        );

        return res.json({ message: "relation description updated" });
    } catch (error) {
        functions.logger.error("Error while updating relation description:", error);
        return res.json({ error: error });
    }
});

//#endregion

//#region admin

const sendPushNotification = async (sender, receiver, message, circle, bigPicture, category) => {
    if (typeof sender === "string") {
        sender = await getCircle(sender);
    }
    if (typeof circle === "string") {
        circle = await getCircle(circle);
    }

    let receiverId = typeof receiver === "string" ? receiver : receiver.id;
    const receiverData = await getCircleData(receiverId);

    if (!receiverData.onesignal_ids || receiverData.onesignal_ids.length === 0) {
        return;
    }

    const config = await getConfig();
    let hostUrl = config.host_url;
    hostUrl += hostUrl.endsWith("/") ? "" : "/";
    const url = `${hostUrl}/circle/${circle.id}/chat`;

    const notification = {
        //included_segments: ["Subscribed Users"], // can be used instead of include_player_ids to send to every user in a segment
        contents: {
            en: sender.name + ": " + message,
        },
        headings: {
            en: circle.name + (category ? ` (${category})` : ""),
        },
        url: url,
        // web_buttons: [
        //     {
        //         id: "open_circle",
        //         text: "Open Circle",
        //         icon: "https://www.google.com/favicon.ico",
        //         url: "https://www.google.com",
        //     },
        // ],
        include_player_ids: receiverData.onesignal_ids.map((x) => x.user_id),
        //android_channel_id: "Chat", // here we can set up channel id to allow android users to turn specific categories on/off, this requires configuration in the OneSignal dashboard, see: https://documentation.onesignal.com/docs/android-notification-categories
        //small_icon: // here we can configure the tiny icon that shows in the status bar of message (default is a bell icon)
        android_group: circle.id, // android grouping of messages
        collapse_id: circle.id + sender.id, // ensures only one message per circle per sender will be shown on a device at any point
        thread_id: circle.id, //iOS grouping
        priority: 10, // 10 = high priority, 5 = normal priority
    };

    if (bigPicture) {
        notification.big_picture = bigPicture;
        notification.huawei_big_picture = bigPicture;
        notification.chrome_web_image = bigPicture;
    }
    if (circle.picture) {
        notification.large_icon = circle.picture;
        notification.chrome_web_icon = circle.picture;
        notification.firefox_icon = circle.picture;
        notification.huawei_large_icon = circle.picture;
    }

    try {
        // functions.logger.log("onesignal-app-id: " + process.env.ONESIGNAL_APP_ID);
        // functions.logger.log("onesignal-api-key: " + process.env.ONESIGNAL_API_KEY?.substring(0, 5));

        //const oneSignalClient = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);
        let oneSignalClientService = getOneSignalClient();
        const res = await oneSignalClientService.createNotification(notification);
        //console.log("push notification sent, response: ", res);
    } catch (error) {
        if (error instanceof OneSignal.HTTPError) {
            console.log(error.statusCode);
            console.log(error.body);
        }
    }
};

const getLocalDateTimeInTimezone = (timezone) => {
    const date = new Date();

    const dateString = date.toLocaleDateString("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const timeString = date.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return `${dateString} ${timeString}`;
};

const getLocalTimeInTimezone = (timezone) => {
    const date = new Date();

    return date.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const toCommaSeparatedList = (items, last_separator = " and ") => {
    switch (items.length) {
        case 0:
            return "";
        case 1:
            return items[0];
        default:
            const allButLast = items.slice(0, -1).join(", ");
            return `${allButLast}${last_separator}${items[items.length - 1]}`;
    }
};

const printMessage = (message) => {
    if (!message) return;
    if (message.function_call) {
        console.log(
            `${message.role}: [Calling function ${message.function_call.name}]\n${JSON.stringify(
                message.function_call.arguments,
                null,
                2
            )}`
        );
    } else if (message.role === "function") {
        console.log(`${message.name} response:\n`, JSON.stringify(message.content, null, 2));
    } else {
        console.log(`${message.role}: ${message.content}`);
    }
};

// triggers AI response for a message
const getAiResponse = async (messageIn, systemMessageStr) => {
    let messages = [];
    let systemMessage = {
        role: "system",
        content: systemMessageStr ?? "You are a helpful assistant.",
    };
    messages.push(systemMessage);
    messages.push({ role: "user", content: messageIn });

    // initiate AI response
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    const openai = new OpenAIApi(configuration);
    let request = {
        messages,
        model: "gpt-4", // model
    };

    printMessage(messages[messages.length - 1]);

    try {
        const response = await openai.createChatCompletion(request);
        let responseMessage = response.data?.choices?.[0]?.message;
        if (responseMessage) {
            messages.push(responseMessage);
        }
        return { messages: messages, responseMessage: responseMessage };
    } catch (error) {
        console.log("error: ", error);
    }

    return null;
};

const getNextAiResponse = async (messages, nextMessage) => {
    // initiate AI response
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    const openai = new OpenAIApi(configuration);
    let request = {
        messages,
        model: "gpt-4", // model
    };

    if (nextMessage) {
        messages.push({ role: "user", content: nextMessage });
    }

    printMessage(messages[messages.length - 1]);

    try {
        const response = await openai.createChatCompletion(request);
        let responseMessage = response.data?.choices?.[0]?.message;
        if (responseMessage) {
            messages.push(responseMessage);
        }
        return { messages: messages, responseMessage: responseMessage };
    } catch (error) {
        console.log("error: ", error);
    }

    return null;
};

// triggers AI agent response for latest user message in a chat session
const triggerAiAgentResponse = async (circle, user, session_id, prompt = undefined) => {
    if (typeof circle === "string") {
        circle = await getCircle(circle);
    }
    if (typeof user === "string") {
        user = await getCircle(user);
    }
    if (!circle || !user) return;

    const date = new Date();
    const circleId = circle.id;

    // ai circle
    let aiCircleId = circle.circle_ids?.find((x) => x !== user.id);
    let aiCircle = await getCircle(aiCircleId);
    let userData = await getCircleData(user.id);

    // get messages in session
    let chatMessagesDocs = [];
    if (session_id) {
        chatMessagesDocs = await db
            .collection("chat_messages")
            .where("circle_id", "==", circle.id)
            .where("session_id", "==", session_id)
            .orderBy("sent_at", "asc")
            .limit(30)
            .get();
    } else {
        chatMessagesDocs = await db
            .collection("chat_messages")
            .where("circle_id", "==", circle.id)
            .orderBy("sent_at", "asc")
            .limit(30)
            .get();
    }

    let messages = [];

    // add system prompt
    let agentCircleData = await getCircleData(aiCircleId);

    // create preamble that includes current time and date, it can include the users current profile summary and other data that can be useful for the assistant to know about
    // if user has timezone stored use it otherwise use system time
    let localDateAndTime = null;
    if (userData?.timezone) {
        localDateAndTime = getLocalDateTimeInTimezone(userData.timezone);
    }
    let systemMessagePreamble = localDateAndTime
        ? `\n\nThe user's local date and time is ${localDateAndTime} (24 hour format). The universal time is ${date.toISOString()}.`
        : `\n\nThe current date and time is ${date.toLocaleString()} (user's local time may differ).`;

    // add information about documents available that can be retrieved through the function getDocument for more details
    let documents = agentCircleData?.ai?.documents ?? [];
    if (documents.length > 0) {
        systemMessagePreamble += `\n\nThese are some notable documents available (in format "<ID>:name - description") that can be searched with the function searchDocument for more details:\n`;
        for (const document of documents) {
            systemMessagePreamble += `${document.id}: ${document.name} - ${document.description}\n`;
        }
    }

    // add information about the user the AI is interacting with
    systemMessagePreamble += `\n\nThe user's profile summary is:\n${getCircleText(user, true)}`;

    let systemMessage = {
        role: "system",
        content: (agentCircleData?.ai?.system_message ?? "You are a helpful assistant.") + systemMessagePreamble,
    };
    messages.push(systemMessage);
    printMessage(systemMessage);

    // add previous messages
    for (var i = 0; i < chatMessagesDocs.docs.length; ++i) {
        let message = chatMessagesDocs.docs[i].data();
        messages.push({
            role: message.user.id === user.id ? "user" : "assistant",
            content: message.message,
        });
    }

    // add custom prompt if specified
    if (prompt) {
        messages.push({ role: "user", content: prompt });
    }

    //console.log("messages: ", JSON.stringify(messages, null, 2));
    // ONBOARDING123
    //     // ai supports onboarding
    //     // see where the user is at in onboarding and send appropriate message
    //     let chatCircleData = await getCircleData(circleId);
    //     let onboardingStatus = chatCircleData?.onboarding_status; // 0 incomplete, 1 complete
    //     if (onboardingStatus !== "complete") {
    //         triggerAiOnboarding(chatCircleData, aiCircle, circleId, user, session_id, messages);
    //         return;
    //     }
    // }

    // if last message isn't a user message we should not trigger AI agent
    if (messages.length <= 0 || messages[messages.length - 1].role !== "user") {
        // if user is onboarding we want to trigger AI agent
        return;
    }

    // add message that will be filled with AI response
    const newMessage = {
        circle_id: circleId,
        user: aiCircle,
        sent_at: date,
        awaits_response: true,
    };
    if (session_id) {
        newMessage.session_id = session_id;
    }

    const chatMessageRef = db.collection("chat_messages").doc();
    await chatMessageRef.set(newMessage);

    // add update to circle that new chat message has been sent
    let updatedCircle = {
        updates: {
            any: date,
            chat: date,
        },
        messages: admin.firestore.FieldValue.increment(1),
    };

    // update circle and propagate changes
    updateCircle(circleId, updatedCircle);

    // update user that chat message has been seen
    setUserSeen(user.id, circleId, "chat");

    // initiate AI response
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    const openai = new OpenAIApi(configuration);
    let request = {
        messages,
        model: "gpt-4", // model
        functions: [
            {
                name: "semanticSearch",
                description: `Does a search among circles for ${toCommaSeparatedList(
                    defaultAiSearchTypes
                )} that are semantically similar to the query and returns a summary of each result, if you want more information about a specific circle call getCircleDetails. Make sure you add important context to the query, e.g. for temporal queries (upcoming events, etc) add the current universal time to the query, for queries relating to user's values, interests, mission, etc. add those specific values to the query. If you need more context about a user, event, circle, etc. call getCircleDetails with the relevant ID.`,
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description:
                                "Query in natural language that will be used in search. Results are ranked by relevance to the query.",
                        },
                        filterTypes: {
                            type: "array",
                            items: { type: "string" },
                            description: `Array containing the types of circles to include in search (if not specified all is included). Types that can be specified: ${toCommaSeparatedList(
                                defaultAiSearchTypes
                            )}.`,
                        },
                        topK: {
                            type: "number",
                            description: "Number of results to return.",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "searchDocuments",
                description: `Does a semantic search among the available documents and retrieves relevant document content. These documents can be constitutions & bylaws, manifestos, policies, meeting minutes, party programs, code of conduct, etc.`,
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: `Query in natural language that will be used in search. Results are ranked by relevance to the query.`,
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "getCircleDetails",
                description: `Returns full details about a specific circle (${toCommaSeparatedList(
                    indexCircleTypes,
                    " or "
                )}).`,
                parameters: {
                    type: "object",
                    properties: {
                        circleId: {
                            type: "string",
                            description: `ID of circle (${toCommaSeparatedList(
                                indexCircleTypes,
                                " or "
                            )}) to get details about. If you don't know the ID do a semantic search first.`,
                        },
                    },
                    required: ["circleId"],
                },
            },
            {
                name: "createEvent",
                description: "Creates a circle which represents an event scheduled at a specific time.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Name of event." },
                        content: {
                            type: "string",
                            description: "Full description of event (markdown allowed).",
                        },
                        starts_at: {
                            type: "string",
                            description:
                                "Start date and time of event in ISO 8601 format. Please specify in Coordinated Universal Time (UTC).",
                        },
                        duration: {
                            type: "number",
                            description: "Duration of event in minutes.",
                        },
                        is_all_day: {
                            type: "boolean",
                            description: "If event is all day.",
                        },
                        parent_circle_id: {
                            type: "string",
                            description: "Id of circle (user, circle, event ,etc) that event belongs to.",
                        },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            description:
                                "Array of tags signifying causes, topics or values the event is associated with.",
                        },
                        rrule: {
                            type: "string",
                            description: "Recurring rule for event in RFC 5545 format.",
                        },
                    },
                    required: ["name", "starts_at"],
                },
            },
        ],
        function_call: "auto",
    };

    let functionCalls = 0;
    let messageData = null;
    let message = null;
    let mentions = [];

    printMessage(messages[messages.length - 1]);

    try {
        while (functionCalls < 4) {
            //console.log(`request ${functionCalls}: ${JSON.stringify(request, null, 2)}`);
            // print last message
            const response = await openai.createChatCompletion(request);
            messageData = response.data?.choices?.[0]?.message;

            // check if AI wanted a function call
            if (messageData?.function_call) {
                // AI wants to call a function
                // append response message to messages
                request.messages.push(messageData);
                printMessage(messageData);

                let functionName = messageData.function_call.name;
                let parametersString = messageData.function_call.arguments;
                let parameters = parametersString ? JSON.parse(parametersString) : null;
                let results = "no results";

                if (functionName === "semanticSearch") {
                    // get parameters
                    if (parameters) {
                        let query = parameters.query;
                        let filterTypes = parameters.filterTypes ?? defaultAiSearchTypes;
                        let topK = parameters.topK ?? 5;

                        // do semantic search
                        let searchResults = await semanticSearch(query, null, filterTypes, topK);
                        if (searchResults.length <= 0) {
                            results = `No results for "${query}".`;
                        } else {
                            let searchResultsMessage = `Search results for "${query}":\n\n`;
                            for (var k = 0; k < searchResults.length; ++k) {
                                let searchResult = searchResults[k];
                                searchResultsMessage += `${getCircleText(searchResult, true)}\n\n`;
                                searchResult.mentioned_at = date;
                                mentions.push(searchResult);
                            }
                            results = searchResultsMessage;
                        }
                    }
                } else if (functionName === "searchDocuments") {
                    // get parameters
                    if (parameters) {
                        let query = parameters.query;
                        let filterTypes = ["document_chunk"];

                        // do semantic search
                        let searchResults = await semanticSearch(
                            query,
                            null,
                            filterTypes,
                            5,
                            documents.map((x) => x.id),
                            true
                        );

                        // results should include a bunch of document chunks, get their content
                        if (searchResults.length <= 0) {
                            results = `No results for "${query}".`;
                        } else {
                            let searchResultsMessage = `Search results for "${query}":\n\n`;
                            for (var z = 0; z < searchResults.length; ++z) {
                                let searchResult = searchResults[z];
                                searchResultsMessage += `${getCircleChunkText(searchResult)}\n\n`;
                            }
                            results = searchResultsMessage;
                        }
                    }
                } else if (functionName === "getCircleDetails") {
                    // get parameters
                    if (parameters) {
                        let circleId = parameters.circleId;

                        // get circle details
                        let circle = await getCircle(circleId);
                        if (circle) {
                            results = getCircleText(circle);
                            circle.mentioned_at = date;
                            mentions.push(circle);
                        } else {
                            results = `Circle with id ${circleId} not found.`;
                        }
                    }
                } else if (functionName === "createEvent") {
                    if (parameters) {
                        let circleReq = { ...parameters, type: "event" };

                        if (circleReq.content) {
                            // if no description, use first part of content
                            if (!circleReq.description) {
                                circleReq.description = circleReq.content.substring(0, 150);
                                if (circleReq.description.length >= 150) {
                                    circleReq.description += "...";
                                }
                            }
                        }
                        // format tags
                        if (circleReq.tags) {
                            let tags = [];
                            for (var n = 0; n < circleReq.tags.length; ++n) {
                                let tag = circleReq.tags[n].trim();
                                if (tag.length > 0) {
                                    // if starts with # remove it
                                    if (tag.startsWith("#")) {
                                        tag = tag.substring(1);
                                    }
                                    tags.push({ name: tag, is_custom: true });
                                }
                            }
                            circleReq.tags = tags;
                        }

                        //  create event
                        let event = await upsertCircle(user.id, circleReq);
                        if (event.errors) {
                            results = `Failed to create event: ${JSON.stringify(event.errors)}`;
                        } else {
                            event.mentioned_at = date;
                            mentions.push(event);
                            results = `Created event [${event.name}](https://codo.earth/circles/${event.id})`;
                        }
                    }
                }

                // update message with function response
                let functionResponseMessage = {
                    role: "function",
                    name: functionName,
                    content: results,
                };
                request.messages.push(functionResponseMessage);
                printMessage(functionResponseMessage);
                ++functionCalls;
            } else {
                message = messageData?.content;
                break;
            }
        }
    } catch (error) {
        console.log("error: ", error);
    }

    // update message with AI response
    chatMessageRef.update({
        awaits_response: false,
        openai_response: messageData ?? {},
        openai_request: request,
        message: message ?? "No response.",
        mentions: mentions,
        has_mentions: mentions.length > 0,
        sent_at: new Date(),
    });
};

const triggerAiOnboarding = async (chatCircleData, aiCircle, circleId, user, session_id, messages) => {
    let date = new Date();
    let onboardingStage = chatCircleData?.onboarding_stage;
    let onboardingStages = ["mission", "mission2", "needs", "offers", "profile"];

    let currentIndex = onboardingStages.indexOf(onboardingStage);
    if (currentIndex < 0) {
        currentIndex = 0;
    }

    console.log("messages:" + JSON.stringify(messages, null, 2));

    // if last message is from user we move to next stage in onboarding
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
        ++currentIndex;
    } else if (messages.length > 0 && messages[messages.length - 1].role === "system") {
        // initiate onboarding
        currentIndex = 0;
    } else {
        // something went wrong, we should not trigger AI agent
        return;
    }

    console.log("current onboarding stage: " + onboardingStage);
    let currentStage = onboardingStages[currentIndex];
    console.log("next onboarding stage: " + currentStage);

    const chatMessageRef = db.collection("chat_messages").doc();
    const newMessage = {
        circle_id: circleId,
        user: aiCircle,
        sent_at: date,
        session_id: session_id,
        awaits_response: true,
    };

    switch (currentStage) {
        default:
        case "mission":
            // start onboarding with first message
            newMessage.message = "What do you **fight** for?";
            newMessage.awaits_response = false;
            await chatMessageRef.set(newMessage);
            break;
        case "mission2":
            // continue onboarding with second message
            // add message that will be filled with AI response
            await chatMessageRef.set(newMessage);
            messages.push({
                role: "system",
                content: "Give an encouraging response in one sentence.",
            });
            //messages.push({ role: "system", content: `Provide an quote, inspiring to changemakers, relating to the user's last response.` });
            let aiResponse = await getNextAiResponse(messages);
            if (aiResponse?.responseMessage) {
                newMessage.message = aiResponse.responseMessage.content;
                newMessage.awaits_response = false;
                chatMessageRef.update(newMessage);
            }
            break;
        case "offers":
            //messages.push({ role: "user", content: "What do you offer?" });
            break;
        case "profile":
            //messages.push({ role: "user", content: "What is your profile summary?" });
            break;
    }

    // update onboarding status
    let updatedCircle = {
        onboarding_stage: currentStage,
    };
    // update circle data
    await db.collection("circle_data").doc(circleId).set(updatedCircle, { merge: true });
};

//#region OpenAI functions

const createEvent = async (
    authCallerId,
    name,
    content,
    starts_at,
    duration,
    is_all_day,
    parent_circle_id,
    tags,
    rrule
) => {
    // const date = new Date();
    // const circleId = parent_circle_id;

    // // create event
    // let event = {
    //     type: "event",
    //     created_at: date,
    //     name: name,
    //     description: description,
    //     starts_at: starts_at,
    //     duration: duration,
    //     is_all_day: is_all_day,
    //     parent_circle_id: parent_circle_id,
    //     tags: tags,
    //     rrule: rrule,
    // };

    // // add event to circle
    // const circleRef = db.collection("circles").doc();
    // await circleRef.set(event);

    // // add connection to circle
    // const userDataRef = db.collection("circle_data").doc(circleId);
    // await userDataRef.set({ connected_to: admin.firestore.FieldValue.arrayUnion(circleRef.id) }, { merge: true });

    // return { id: circleRef.id, ...event };
    return null;
};

const fn_getMemberData = async (circleId) => {
    const memberConnections = await getMemberConnections(circleId);
    const members = memberConnections
        .filter((x) => x.target.type === "user")
        .map((x) => {
            return {
                id: x.target.id,
                name: x.target.name,
                description: x.target.description,
                content: x.target.content,
            };
        });
    return {
        members: members,
        total_count: 120,
        on_codo_platform: members.length,
    };
};

//#endregion

const sendOpenAIChatPrompt = async (prompt, temperature = undefined, max_tokens = undefined) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    const openai = new OpenAIApi(configuration);
    let request = {
        messages: [
            {
                role: "system",
                content:
                    "Ditt namn är Stellan och du är partiledare för Basinkomstpartiet i Sverige. Du är humanitär och omsorgsfull. Du bryr dig djupt om naturen och mänskligheten. Du älskar teknisk innovation (av sociala, ekonomiska och tekniska system) och vill att det ska användas för att bemyndiga folket att göra gott och göra alla välbärgade. Du vill tjäna mänskligheten och hjälpa den uppfylla sin potential. Du inspirerar och mobiliserar mänskligheten, håller plats för kreativitet och utforskande, och verkar för att vi lyfter golvet för alla. Du har också ett sinne för humor, är djärv (med glimten i ögat) och spelar också på att du är en AI/robot och meningsmotståndare är människor.",
            },
            { role: "user", content: prompt },
        ],
        model: "gpt-4-1106-preview", // model
    };
    if (temperature !== undefined) {
        request.temperature = temperature;
    }
    if (max_tokens !== undefined) {
        request.max_tokens = max_tokens;
    }

    const response = await openai.createChatCompletion(request);

    return response.data;
};

const sendOpenAIPrompt = async (prompt, temperature, max_tokens) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI,
    });

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-003", // model
        prompt: prompt, // prompt,
        temperature: temperature, //0,
        max_tokens: max_tokens,
    });

    return response.data;
};

app.post("/openai", auth, async (req, res) => {
    // see update method for how open AI is used
    // let config = await getConfig();
    // const authCallerId = req.user.user_id;
    // const model = req.body.model;
    // const prompt = req.body.prompt;
    // const temperature = req.body.temperature;
    // const max_tokens = req.body.max_tokens;

    // if (!config.admins.includes(authCallerId)) {
    //     return res.status(403).json({ error: "unauthorized" });
    // }

    // const configuration = new Configuration({
    //     apiKey: process.env.OPENAI,
    // });

    // const openai = new OpenAIApi(configuration);
    // const response = await openai.createCompletion({
    //     model: "text-davinci-003", // model
    //     prompt: "Write a short poem about creativity", // prompt,
    //     temperature: 0, //temperature, //0,
    //     max_tokens: 500, // max_tokens,
    // });

    //return res.json(response.data);
    return res.json({});
});

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

        if (commandArgs[0] === "list") {
            // list all commants
            let commands = [
                { name: "list", description: "Lists all commands." },
                {
                    name: "delete_circle",
                    args: "<circle_id>",
                    description: "Delete circle.",
                },
                {
                    name: "search",
                    args: "<query> | circle <circle_id> ?<type>",
                    description: "Does semantic search using either query or circle ID.",
                },
                {
                    name: "ai_search_docs",
                    args: "<agent_id> <query>",
                    description: "Does semantic search among documents similar to what the AI does.",
                },
                {
                    name: "upsert_embeddings",
                    description: "Goes through all circles and upserts embeddings into pinecone database.",
                },
                {
                    name: "connect",
                    args: "<source_id> connected_mutually_to/admin_of/admin_by <target_id>",
                    description: "Creates a connection between two circles.",
                },
                {
                    name: "get_connections",
                    args: "<circle_id>",
                    description: "Gets all connections for a circle.",
                },
                {
                    name: "count_new_circles",
                    args: "<type> <date>",
                    description: "Counts new circles of specified type that has created since date specified.",
                },
                {
                    name: "circle_text",
                    args: "<circle_id> ?<is_condensed true|false>",
                    description: "Gets text representation of circle.",
                },
                {
                    name: "get_emails",
                    args: "<?date>",
                    description: "Gets a list of emails for all users that have signed up for the newsletter.",
                },
            ];
            return res.json({ commands });
        } else if (commandArgs[0] === "delete_circle") {
            await deleteCircle(commandArgs[1]);
        } else if (commandArgs[0] === "get_emails") {
            // loops through all circles and creates embeddings for them and stores them in the pinecone database
            let date = new Date(commandArgs[2] ?? "2020-01-01");
            let circleDocs = await db.collection("circle_data").where("created_at", ">=", date).get();
            let circleData = [];
            for (var j = 0; j < circleDocs.docs.length; ++j) {
                circleData.push({
                    id: circleDocs.docs[j].id,
                    ...circleDocs.docs[j].data(),
                });
            }
            let emails = circleData.filter((x) => x.agreed_to_email_updates && x.email).map((x) => x.email);
            return res.json({ emails });
        } else if (commandArgs[0] === "search") {
            // do semantic search using either query or circle ID
            let query = null;
            let circleId = null;
            let filterType = null;

            if (commandArgs[1] === "circle") {
                query = null;
                circleId = commandArgs[2];
                filterType = commandArgs[3];
            } else {
                circleId = null;
                commandArgs.shift();
                query = commandArgs.join(" ");
                filterType = null;
            }

            try {
                let result = await semanticSearch(query, circleId, filterType ? [filterType] : defaultSearchTypes, 20);
                return res.json({
                    data: result.map((x) => {
                        return {
                            name: x.name,
                            description: x.description,
                            type: x.type,
                            score: x.score,
                        };
                    }),
                });
            } catch (error) {
                return res.json({ error: error });
            }
        } else if (commandArgs[0] === "ai_search_docs") {
            let agentId = commandArgs[1];
            let query = commandArgs.slice(2).join(" ");
            let filterTypes = ["document_chunk"];
            let agentCircleData = await getCircleData(agentId);
            let documents = agentCircleData?.ai?.documents ?? [];
            if (documents.length <= 0) {
                return res.json({ error: "No documents available for agent." });
            }

            console.log("searching in documents: " + JSON.stringify(documents));

            // do semantic search
            let searchResults = await semanticSearch(
                query,
                null,
                filterTypes,
                5,
                documents.map((x) => x.id),
                true
            );

            // results should include a bunch of document chunks, get their content
            let results = "";
            if (searchResults.length <= 0) {
                results = `No results for "${query}".`;
            } else {
                let searchResultsMessage = `Search results for "${query}":\n\n`;
                for (var z = 0; z < searchResults.length; ++z) {
                    let searchResult = searchResults[z];
                    searchResultsMessage += `${getCircleChunkText(searchResult)}\n\n`;
                }
                results = searchResultsMessage;
            }
            return res.json({ results });
        } else if (commandArgs[0] === "upsert_embeddings") {
            // loops through all circles and creates embeddings for them and stores them in the pinecone database
            let circleDocs = await db.collection("circles").get();
            let circles = [];
            for (var j = 0; j < circleDocs.docs.length; ++j) {
                circles.push({
                    id: circleDocs.docs[j].id,
                    ...circleDocs.docs[j].data(),
                });
            }
            let response = await upsertCirclesEmbeddings(circles);

            return res.json(response);
        } else if (commandArgs[0] === "openai") {
            const max_tokens = parseInt(commandArgs[1]);
            const temperature = parseFloat(commandArgs[2]);
            const prompt = commandArgs.slice(3).join(" ");

            const configuration = new Configuration({
                apiKey: process.env.OPENAI,
            });

            const openai = new OpenAIApi(configuration);
            const response = await openai.createCompletion({
                model: "text-davinci-003", // model
                prompt: prompt, // prompt,
                temperature: temperature, //0,
                max_tokens: max_tokens,
            });

            return res.json(response.data);
        } else if (commandArgs[0] === "send_test_message") {
            const circleId = commandArgs[1];
            const message = commandArgs.slice(2).join(" ");
            //await sendPushNotification(authCallerId, circleId, message, authCallerId);

            // test the onesignal integration
            const sender = await getCircle(authCallerId);
            const circle = await getCircle(authCallerId);
            const receiverData = await getCircleData(circleId);
            if (!receiverData.onesignal_ids || receiverData.onesignal_ids.length === 0) {
                return res.json({
                    message: "Receiver has no OneSignal subscription",
                });
            }

            const config = await getConfig();
            let hostUrl = config.host_url;
            hostUrl += hostUrl.endsWith("/") ? "" : "/";
            const url = `${hostUrl}/circle/${circleId}`;

            // test one, send simple message to all users
            const notification2 = {
                contents: {
                    en: "test message 2",
                },
                headings: {
                    en: "test message 2",
                },
                url: url,
                include_player_ids: receiverData.onesignal_ids.map((x) => x.user_id),
            };
            const notification3 = {
                contents: {
                    en: "test message 3",
                },
                headings: {
                    en: "test message 3",
                },
                url: url,
                include_player_ids: [receiverData.onesignal_ids?.[0]?.user_id],
            };
            const notification4 = {
                contents: {
                    en: "test message 4",
                },
                headings: {
                    en: "test message 4",
                },
                url: url,
                include_player_ids: [receiverData.onesignal_ids?.[1]?.user_id],
            };
            const notification5 = {
                contents: {
                    en: "test message 5",
                },
                headings: {
                    en: "test message 5",
                },
                url: url,
                include_player_ids: [receiverData.onesignal_ids?.[2]?.user_id],
            };

            const notification6 = {
                contents: {
                    en: "test message 6",
                },
                headings: {
                    en: "test message 6",
                },
                url: url,
                include_player_ids: receiverData.onesignal_ids.map((x) => x.user_id),
                android_group: circle.id,
                collapse_id: circle.id + sender.id,
                thread_id: circle.id,
                priority: 10,
            };

            if (circle.cover) {
                notification6.big_picture = circle.cover;
                notification6.huawei_big_picture = circle.cover;
                notification6.chrome_web_image = circle.cover;
            }
            if (circle.picture) {
                notification6.large_icon = circle.picture;
                notification6.chrome_web_icon = circle.picture;
                notification6.firefox_icon = circle.picture;
                notification6.huawei_large_icon = circle.picture;
            }

            try {
                //const oneSignalClient = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_API_KEY);
                let oneSignalClientService = getOneSignalClient();
                let res = await oneSignalClientService.createNotification(notification2);
                console.log("push notification sent, response: ", res);
                res = await oneSignalClientService.createNotification(notification3);
                console.log("push notification sent, response: ", res);
                res = await oneSignalClientService.createNotification(notification4);
                console.log("push notification sent, response: ", res);
                res = await oneSignalClientService.createNotification(notification5);
                console.log("push notification sent, response: ", res);
                res = await oneSignalClientService.createNotification(notification6);
                console.log("push notification sent, response: ", res);
            } catch (error) {
                if (error instanceof OneSignal.HTTPError) {
                    console.log(error.statusCode);
                    console.log(error.body);
                }
            }
        } else if (commandArgs[0] === "check_circle_data") {
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
            // connects two circles together connect <source> <type> <target> <notify>, e.g. connect 123 connected_mutually_to 456 true
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
                return res.json({
                    error: "source can't be the same as target",
                });
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
            const connectionDocs = await db
                .collection("connections")
                .where("circle_ids", "array-contains", targetId)
                .get();

            let result = {
                connection_count: `${connectionDocs.docs.length} connections`,
                connections: [],
            };

            if (commandArgs[2] !== "count") {
                // loop through connections and update them
                for (var i = 0; i < connectionDocs.docs.length; ++i) {
                    let connection = connectionDocs.docs[i].data();
                    result.connections.push(connection);
                }
            }

            return res.json({ result });
        } else if (commandArgs[0] === "count_new_circles") {
            // count_new_circles <type> <date>, e.g. count_new_circles circle 2021-01-01
            // count number of new circles that has been created after a certain date after a certain date
            let type = commandArgs[1];
            if (!type) {
                return res.json({ error: "invalid type" });
            }
            let date = new Date(commandArgs[2] ?? "2020-01-01");
            const snapshot = await db
                .collection("circles")
                .where("type", "==", type)
                .where("created_at", ">=", date)
                .get();

            let result = { count: `${snapshot.docs.length} ${type}s` };
            return res.json({ result });
        } else if (commandArgs[0] === "markdown") {
            // converts HTML circle description to Markdown, can be removed once all circles have been converted
            let targetId = commandArgs[1];
            if (!targetId) {
                return res.json({ error: "invalid target" });
            }
            if (targetId === "all") {
                // go through every circle and convert their HTML content to Markdown
                let circleData = await db.collection("circles").get();
                let count = 0;
                circleData.forEach(async (doc) => {
                    let circle = doc.data();
                    circle.id = doc.id;
                    if (circle.content?.startsWith("<")) {
                        // convert HTML to Markdown
                        let newContent = turndownService.turndown(circle.content);
                        await upsertCircle(circle.id, {
                            id: circle.id,
                            content: newContent,
                        });
                        ++count;
                    }
                });
                return res.json({ message: "" + count + " circles updated" });
            } else {
                const circle = await getCircle(targetId);
                if (!circle) {
                    return res.json({ error: "invalid target" });
                }

                let newContent = turndownService.turndown(circle.content);
                await upsertCircle(targetId, {
                    id: targetId,
                    content: newContent,
                });
            }
        } else if (commandArgs[0] === "circle_text") {
            // gets circle text for a circle
            let targetId = commandArgs[1];
            let condensed = commandArgs[2] === "true";
            if (!targetId) {
                return res.json({ error: "invalid target" });
            }
            const circle = await getCircle(targetId);
            if (!circle) {
                return res.json({ error: "invalid target" });
            }
            return res.json({ circle_text: getCircleText(circle, condensed) });
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
    secrets: [
        "OPENAI",
        "ONESIGNAL_APP_ID",
        "ONESIGNAL_API_KEY",
        "JITSI_API_KEY",
        "JITSI_DOMAIN",
        "PINECONE_API_KEY",
        "PINECONE_ENVIRONMENT",
        // "ZOOM_SDK_KEY",
        // "ZOOM_SDK_SECRET",
    ],
};

exports.api = functions.region("europe-west1").runWith(runtimeOpts).https.onRequest(app);

exports.preRender = functions.https.onRequest(async (request, response) => {
    // Error 404 is false by default
    let error404 = false;
    const path = request.path ? request.path.split("/") : request.path;

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

    // baseurl/circles/:id

    if (path.length >= 2) {
        if (path[1] === "circles") {
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
                        let weekday = dateObj.toLocaleString("sv", {
                            weekday: "short",
                        });
                        let monthday = dateObj.toLocaleDateString("sv", {
                            month: "short",
                            day: "numeric",
                        });
                        let time = dateObj.toLocaleTimeString("sv", {
                            hour: "2-digit",
                            minute: "2-digit",
                        });
                        datestr = ` (${weekday}, ${monthday} kl ${time})`;
                    }

                    title = `Delta i eventet &quot;${circle.name}&quot;${datestr} på ${appName}`;
                } else {
                    if (circle.starts_at) {
                        let dateObj = circle.starts_at.toDate();
                        let weekday = dateObj.toLocaleString("en", {
                            weekday: "short",
                        });
                        let monthday = dateObj.toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                        });
                        let time = dateObj.toLocaleTimeString("en", {
                            hour: "2-digit",
                            minute: "2-digit",
                        });
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
