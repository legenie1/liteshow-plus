export interface ImageFile {
  name: string;
  path: string;
}

export interface PrayerPoint {
  number: string;
  text: string;
  reference: string;
  verse: string;
  footer: string;
}

export interface VideoFile {
  name: string;
}

export interface MonitorInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isPrimary: boolean;
}

export interface ProjectionState {
  image: string | null;
  video: string | null;
  videoSerial: number;
  videoLoop: boolean;
  videoMuted: boolean;
  prayer: PrayerPoint | null;
  blackout: boolean;
}
