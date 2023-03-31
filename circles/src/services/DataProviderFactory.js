import CirclesDataProvider from "services/CirclesDataProvider";
import GitHubDataProvider from "services/GitHubDataProvider";
import HolonsDataProvider from "services/HolonsDataProvider";

// returns a data provider based on the source type
export class DataProviderFactory {
    static createDataProvider(sourceType) {
        switch (sourceType) {
            default:
            case "circles":
                return new CirclesDataProvider();
            case "github":
                return new GitHubDataProvider();
            case "holons":
                return new HolonsDataProvider();
        }
    }
}
