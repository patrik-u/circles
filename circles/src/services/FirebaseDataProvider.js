import { CircleDataProvider } from "services/CircleDataProvider";
import db from "components/Firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

// fetches and saves circle data from the Firebase backend
export default class FirebaseDataProvider extends CircleDataProvider {
    async getCircle(circleId) {
        // subscribe to circle
        let unsubscribeGetCircle = onSnapshot(doc(db, "circles", circleId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists) {
                return;
            }
            newCircle.id = doc.id;
            return newCircle;
        });
        return unsubscribeGetCircle;
    }

    supportsSubscription() {
        return true;
    }
}
