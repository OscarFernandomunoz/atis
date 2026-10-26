// Información de un bloque naranja leído del calendario de disponibilidad.
export interface SofiaAvailabilityEntry {
  date: string;
  details: string;
  durationMinutes: number | null;
}
