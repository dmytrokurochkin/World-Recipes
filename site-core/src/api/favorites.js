import { getActiveProfile } from './profiles';

function getRequiredProfileId() {
  const activeProfile = getActiveProfile();
  if (!activeProfile || !activeProfile.id) {
    throw new Error('Please register or select a profile first.');
  }

  return activeProfile.id;
}

function requestFavorites(path, options) {
  const profileId = getRequiredProfileId();

  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Profile-Id': profileId,
      ...(options && options.headers ? options.headers : {})
    }
  }).then(function(response) {
    return response.json().then(function(data) {
      if (!response.ok) {
        const message = data && data.error ? data.error.message : 'Request failed';
        throw new Error(message);
      }
      return data;
    });
  });
}

export function getProfileFavorites() {
  return requestFavorites('/api/profile/favorites', {
    method: 'GET'
  }).then(function(data) {
    return data.favorites || [];
  });
}

export function addProfileFavorite(recipeId) {
  return requestFavorites('/api/profile/favorites', {
    method: 'POST',
    body: JSON.stringify({ recipeId: String(recipeId) })
  });
}

export function removeProfileFavorite(recipeId) {
  return requestFavorites(`/api/profile/favorites/${recipeId}`, {
    method: 'DELETE'
  });
}
