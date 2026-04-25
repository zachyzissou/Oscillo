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
    dependencies: [
        .package(url: "https://github.com/sparkle-project/Sparkle", exact: "2.9.1")
    ],
    targets: [
        .target(name: "OscilloCore"),
        .executableTarget(
            name: "OscilloMac",
            dependencies: [
                "OscilloCore",
                .product(name: "Sparkle", package: "Sparkle")
            ]
        ),
        .testTarget(
            name: "OscilloCoreTests",
            dependencies: ["OscilloCore"]
        )
    ]
)
