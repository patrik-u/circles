import { DataProvider } from "services/DataProvider";
import db from "components/Firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

// fetches and saves circle data from the Firebase backend
export default class FirebaseDataProvider extends DataProvider {
    subscribeToCircle(circleId, callback) {
        // subscribe to circle
        let unsubscribeGetCircle = onSnapshot(doc(db, "circles", circleId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists || !newCircle) {
                return;
            }
            newCircle.id = doc.id;
            callback(newCircle);
        });
        return unsubscribeGetCircle;
    }

    subscribeToCircleData(circleId, callback) {
        // subscribe to circle
        let unsubscribeGetCircle = onSnapshot(doc(db, "circle_data", circleId), (doc) => {
            var newCircleData = doc.data();
            if (!doc.exists || !newCircleData) {
                return;
            }
            newCircleData.id = doc.id;
            callback(newCircleData);
        });
        return unsubscribeGetCircle;
    }

    supportsSubscription() {
        return true;
    }
}
