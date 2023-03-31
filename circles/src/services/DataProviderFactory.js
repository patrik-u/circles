import FirebaseDataProvider from "services/FirebaseDataProvider";
import GitHubDataProvider from "services/GitHubDataProvider";
import HolonsDataProvider from "services/HolonsDataProvider";

// returns a data provider based on the source type
export class DataProviderFactory {
    static createDataProvider(sourceType) {
        switch (sourceType) {
            case "firebase":
                return new FirebaseDataProvider();
            case "github":
                return new GitHubDataProvider();
            case "holons":
                return new HolonsDataProvider();
            default:
                console.log("Unsupported data source: " + sourceType);
            //throw new Error(`Unsupported data source: ${sourceType}`);
        }
    }
}
