const PROFILE_ID_KEY = 'wr_profile_id';
const PROFILE_NAME_KEY = 'wr_profile_name';

function parseJson(response) {
  return response.json().then(function(data) {
    if (!response.ok) {
      const message = data && data.error ? data.error.message : 'Request failed';
      throw new Error(message);
    }

    return data;
  });
}

export function getActiveProfile() {
  const id = localStorage.getItem(PROFILE_ID_KEY);
  const username = localStorage.getItem(PROFILE_NAME_KEY);

  if (!id || !username) {
    return null;
  }

  return { id, username };
}

export function setActiveProfile(profile) {
  localStorage.setItem(PROFILE_ID_KEY, profile.id);
  localStorage.setItem(PROFILE_NAME_KEY, profile.username);
  window.dispatchEvent(new Event('wr-profile-changed'));
}

export function clearActiveProfile() {
  localStorage.removeItem(PROFILE_ID_KEY);
  localStorage.removeItem(PROFILE_NAME_KEY);
  window.dispatchEvent(new Event('wr-profile-changed'));
}

export function fetchProfiles() {
  return fetch('/api/profiles', { method: 'GET' })
    .then(parseJson)
    .then(function(data) {
      return data.profiles || [];
    });
}

export function registerProfile(username) {
  return fetch('/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: String(username) })
  })
    .then(parseJson)
    .then(function(data) {
      return data.profile;
    });
}
