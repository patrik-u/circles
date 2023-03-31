import { CircleDataProvider } from "services/CircleDataProvider";
import axios from "axios";

// fetches and saves circle data from Holons
export default class HolonsDataProvider extends CircleDataProvider {
    async getCircle(circleId) {
        let response = await axios.get(circleId);
        if (response.status === 200) {
            const circle = response.data;
            if (circle) {
                return circle;
            }
        }
        return null;
    }
}
