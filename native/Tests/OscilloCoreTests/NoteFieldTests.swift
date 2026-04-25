import XCTest
@testable import OscilloCore

final class NoteFieldTests: XCTestCase {
    func testGeneratesDeterministicSpiralNotes() {
        let notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
        let field = NoteField.generate(scaleNotes: notes)

        XCTAssertEqual(field.count, notes.count)
        XCTAssertEqual(field[0].note, "C4")
        XCTAssertEqual(field[0].kind, .chord)
        XCTAssertEqual(field[1].kind, .note)
        XCTAssertEqual(field[3].kind, .beat)
        XCTAssertEqual(field[0].position.x, 6.0, accuracy: 0.0001)
        XCTAssertEqual(field[0].position.y, -4.0, accuracy: 0.0001)
        XCTAssertEqual(field[0].position.z, 0.0, accuracy: 0.0001)
    }

    func testLimitsSpiralToTwelveNotes() {
        let notes = (0..<24).map { "N\($0)" }
        let field = NoteField.generate(scaleNotes: notes)

        XCTAssertEqual(field.count, 12)
        XCTAssertEqual(field.last?.note, "N11")
    }
}
