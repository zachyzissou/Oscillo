import Accelerate
import Foundation

public final class VDSPFrequencyAnalyzer: @unchecked Sendable {
    public let sampleCount: Int

    private let halfCount: Int
    private let log2SampleCount: vDSP_Length
    private let fftSetup: FFTSetup

    public init?(sampleCount: Int) {
        guard sampleCount >= 2, sampleCount.isPowerOfTwo else {
            return nil
        }

        let log2Value = vDSP_Length(log2(Double(sampleCount)))
        guard let setup = vDSP_create_fftsetup(log2Value, FFTRadix(kFFTRadix2)) else {
            return nil
        }

        self.sampleCount = sampleCount
        self.halfCount = sampleCount / 2
        self.log2SampleCount = log2Value
        self.fftSetup = setup
    }

    deinit {
        vDSP_destroy_fftsetup(fftSetup)
    }

    public func magnitudes(for samples: [Float], applyHannWindow: Bool = true) -> [Float] {
        var input = Array(repeating: Float(0), count: sampleCount)
        let copyCount = min(samples.count, sampleCount)

        if copyCount > 0 {
            input.replaceSubrange(0..<copyCount, with: samples[0..<copyCount])
        }

        if applyHannWindow {
            var window = Array(repeating: Float(0), count: sampleCount)
            vDSP_hann_window(&window, vDSP_Length(sampleCount), Int32(vDSP_HANN_NORM))
            vDSP_vmul(input, 1, window, 1, &input, 1, vDSP_Length(sampleCount))
        }

        var real = Array(repeating: Float(0), count: halfCount)
        var imaginary = Array(repeating: Float(0), count: halfCount)
        var powers = Array(repeating: Float(0), count: halfCount)

        real.withUnsafeMutableBufferPointer { realPointer in
            imaginary.withUnsafeMutableBufferPointer { imaginaryPointer in
                var splitComplex = DSPSplitComplex(
                    realp: realPointer.baseAddress!,
                    imagp: imaginaryPointer.baseAddress!
                )

                input.withUnsafeBufferPointer { inputPointer in
                    inputPointer.baseAddress!.withMemoryRebound(
                        to: DSPComplex.self,
                        capacity: halfCount
                    ) { complexPointer in
                        vDSP_ctoz(
                            complexPointer,
                            2,
                            &splitComplex,
                            1,
                            vDSP_Length(halfCount)
                        )
                    }
                }

                vDSP_fft_zrip(
                    fftSetup,
                    &splitComplex,
                    1,
                    log2SampleCount,
                    FFTDirection(FFT_FORWARD)
                )

                splitComplex.realp[0] = 0
                splitComplex.imagp[0] = 0

                vDSP_zvmags(
                    &splitComplex,
                    1,
                    &powers,
                    1,
                    vDSP_Length(halfCount)
                )
            }
        }

        let scale = Float(2) / Float(sampleCount)
        return powers.map { sqrt(max($0, 0)) * scale }
    }
}

private extension Int {
    var isPowerOfTwo: Bool {
        self > 0 && (self & (self - 1)) == 0
    }
}
