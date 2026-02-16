export async function initDatabase(): Promise<void> {
  // No-op on web — data comes from mockEvents.json
}

export async function getDatabase(): Promise<null> {
  // No-op on web — SQLite is not available
  return null;
}
