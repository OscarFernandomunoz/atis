// Información de un bloque naranja leído del calendario de disponibilidad.
export interface SofiaAvailabilityEntry {
  date: string;
  details: string;
  durationMinutes: number | null;
}

export interface SofiaIdentificationAvailability {
  identification: string;
  entries: SofiaAvailabilityEntry[];
  error: string | null;
}
