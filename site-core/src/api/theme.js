function parseJson(response) {
  return response.json().then(function(data) {
    if (!response.ok) throw new Error(data?.error?.message || 'Request failed');
    return data;
  });
}

export function getTheme() {
  return fetch('/api/theme', { method: 'GET' })
    .then(parseJson);
}

export function setTheme(theme) {
  return fetch('/api/theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme })
  }).then(parseJson);
}