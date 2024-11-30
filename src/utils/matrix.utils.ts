export function formatUserId(username: string, homeserver: string): string {
  if (username.startsWith('@') && username.includes(':')) return username;
  const hostname = new URL(homeserver).hostname;
  return `@${username}:${hostname}`;
}

export function formatRoomAlias(roomId: string): string {
  return roomId.startsWith('#') ? roomId : `#${roomId}`;
}

export function extractDomain(serverUrl: string): string {
  try {
    return new URL(serverUrl).hostname;
  } catch (error) {
    throw new Error('Invalid server URL');
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateUsername(userId: string): string {
  return userId.split(':')[0].substring(1);
}