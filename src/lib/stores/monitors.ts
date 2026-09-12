import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { MonitorInfo } from "$lib/types";

const STORAGE_KEY = "liteshow.selectedMonitorId";

export const monitors = writable<MonitorInfo[]>([]);
export const selectedMonitorId = writable<string | null>(null);

export async function loadMonitors(): Promise<MonitorInfo[]> {
  const found = await invoke<MonitorInfo[]>("list_monitors");
  monitors.set(found);
  return found;
}

export async function selectMonitor(id: string): Promise<void> {
  await invoke("open_projection_window", { monitorId: id });
  selectedMonitorId.set(id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage can throw in a locked-down webview profile — losing the
    // remembered monitor across restarts is an acceptable degradation.
  }
}

export function getRememberedMonitorId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
