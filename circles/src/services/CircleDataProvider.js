// fetches and saves circle data
export class CircleDataProvider {
    async getCircle(circleId) {
        throw new Error("Not implemented");
    }

    subscribeToCircle(circleId, callback) {
        throw new Error("Not implemented");
    }

    supportsSubscription() {
        return false;
    }
}
