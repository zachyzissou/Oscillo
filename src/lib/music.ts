// Music-related utilities

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function getInterval(note: string, semitones: number): string {
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) return note

  const [, noteName, octaveStr] = match
  const octave = parseInt(octaveStr, 10)
  const noteIndex = NOTE_NAMES.indexOf(noteName)
  if (noteIndex < 0) return note

  const newIndex = (noteIndex + semitones + 1200) % 12
  const octaveDelta = Math.floor((noteIndex + semitones) / 12)
  const newOctave = octave + octaveDelta

  return `${NOTE_NAMES[newIndex]}${newOctave}`
}

