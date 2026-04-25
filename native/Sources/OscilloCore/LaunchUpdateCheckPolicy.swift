public struct LaunchUpdateCheckPolicy: Sendable {
    private var hasStartedAutomaticCheck = false

    public init() {}

    public mutating func shouldStartAutomaticCheck() -> Bool {
        guard !hasStartedAutomaticCheck else {
            return false
        }

        hasStartedAutomaticCheck = true
        return true
    }
}
