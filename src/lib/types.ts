export interface ImageFile {
  name: string;
  path: string;
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
  blackout: boolean;
}
