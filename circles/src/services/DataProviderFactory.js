import FirebaseDataProvider from "/services/FirebaseDataProvider";
import GithubDataProvider from "/services/GithubDataProvider";
import HolonsDataProvider from "/services/HolonsDataProvider";

// returns a data provider based on the source type
export class DataProviderFactory {
    static createDataProvider(sourceType) {
        switch (sourceType) {
            case "firebase":
                return new FirebaseDataProvider();
            case "github":
                return new GithubDataProvider();
            case "holons":
                return new HolonsDataProvider();
            default:
                throw new Error(`Unsupported data source: ${sourceType}`);
        }
    }
}
