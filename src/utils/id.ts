import { randomUUID } from 'expo-crypto';

/** UUIDv4 primary key. Text IDs keep the door open for future Cloud Sync. */
export function newId(): string {
  return randomUUID();
}
