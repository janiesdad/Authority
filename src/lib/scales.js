export const SCALE_DEGREES = {
    Major: [0, 2, 4, 5, 7, 9, 11],
    "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    "Pentatonic Major": [0, 2, 4, 7, 9],
    "Pentatonic Minor": [0, 3, 5, 7, 10],
};
export const ROOT_NOTES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];
export const NOTE_TO_SEMITONE = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
    C2: 12,
};
export function getAllowedSemitones(root, scale) {
    const rootSemitone = NOTE_TO_SEMITONE[root] % 12;
    const degrees = SCALE_DEGREES[scale];
    return new Set(degrees.map((d) => (rootSemitone + d) % 12));
}
export function quantizeSemitoneToScale(semitone, root, scale) {
    const allowed = getAllowedSemitones(root, scale);
    if (allowed.has(((semitone % 12) + 12) % 12))
        return semitone;
    // Search nearest up/down
    for (let distance = 1; distance <= 6; distance++) {
        const up = semitone + distance;
        const down = semitone - distance;
        if (allowed.has(((up % 12) + 12) % 12))
            return up;
        if (allowed.has(((down % 12) + 12) % 12))
            return down;
    }
    return semitone;
}
export function semitoneToFrequency(baseFrequencyC4, semitoneFromC4) {
    return baseFrequencyC4 * Math.pow(2, semitoneFromC4 / 12);
}
