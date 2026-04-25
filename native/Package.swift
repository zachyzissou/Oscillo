// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "OscilloNative",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(name: "OscilloCore", targets: ["OscilloCore"]),
        .executable(name: "OscilloMac", targets: ["OscilloMac"])
    ],
    targets: [
        .target(name: "OscilloCore"),
        .executableTarget(
            name: "OscilloMac",
            dependencies: ["OscilloCore"]
        ),
        .testTarget(
            name: "OscilloCoreTests",
            dependencies: ["OscilloCore"]
        )
    ]
)
