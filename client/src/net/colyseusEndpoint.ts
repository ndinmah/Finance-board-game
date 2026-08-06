interface BrowserLocation {
  protocol: string;
  host: string;
}

export function resolveColyseusEndpoint(
  explicitUrl: string | undefined,
  isDev: boolean,
  location: BrowserLocation,
): string {
  if (explicitUrl) return explicitUrl;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const pathname = isDev ? '/colyseus' : '';
  return `${protocol}//${location.host}${pathname}`;
}
