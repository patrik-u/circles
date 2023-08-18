// fetches and saves circle data
export class DataProvider {
    async getCircle(circleId) {
        throw new Error("Not implemented");
    }

    async getCircleData(circleId) {
        throw new Error("Not implemented");
    }

    subscribeToCircle(circleId, callback) {
        throw new Error("Not implemented");
    }

    subscribeToCircleData(circleId, callback) {
        throw new Error("Not implemented");
    }

    supportsSubscription() {
        return false;
    }
}
