/** Room's `equipment` column is stored as a JSON string (SQLite has no native array type). */
export function parseEquipment(equipmentJson: string): string[] {
  try {
    const parsed = JSON.parse(equipmentJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeEquipment(equipment: string[]): string {
  return JSON.stringify(equipment ?? []);
}

/** Shapes a Room row (with raw `equipment` JSON string) for API responses. */
export function serializeRoom<T extends { equipment: string }>(room: T) {
  return { ...room, equipment: parseEquipment(room.equipment) };
}

/**
 * True if two [start, end) time ranges (on the same date) overlap.
 * Times are "HH:MM" strings, which compare correctly as plain strings.
 */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
