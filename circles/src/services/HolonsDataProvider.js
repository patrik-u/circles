import { DataProvider } from "services/DataProvider";
import axios from "axios";

// fetches and saves circle data from Holons
export default class HolonsDataProvider extends DataProvider {
    async getCircle(circleId) {
        let response = await axios.get(circleId);
        if (response.status === 200) {
            const holon = response.data;
            if (!holon) return null;

            let circle = {};
            circle.id = holon.id;
            circle.name = holon.name;
            circle.description = holon.description;
            circle.picture = holon.image;
            circle.author = holon.author;
            circle.repository = holon.repository;
            circle.homepage = holon.homepage;
            circle.base = holon.geolocation ? { latitude: holon.geolocation.lat, longitude: holon.geolocation.lng } : null;
            circle.tags = holon.keywords
                ? holon.keywords.map((x) => {
                      return { name: x, text: "#" + x };
                  })
                : [];
            return circle;
        }
        return null;
    }
}
