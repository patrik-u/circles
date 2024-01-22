import CirclesDataProvider from "@/services/CirclesDataProvider";

// returns a data provider based on the source type
export class DataProviderFactory {
    static createDataProvider(sourceType) {
        switch (sourceType) {
            default:
            case "circles":
                return new CirclesDataProvider();
        }
    }
}
