import { useEffect, useState } from 'react';
import { fetchProfiles, getActiveProfile, registerProfile, setActiveProfile } from '../api/profiles';
import './home.css';

function Profiles() {
  const [username, setUsername] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(getActiveProfile());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function loadProfiles() {
    return fetchProfiles()
      .then(function(items) {
        setProfiles(items);
      })
      .catch(function(err) {
        setError(err.message || 'Could not load profiles.');
      });
  }

  useEffect(function() {
    loadProfiles();
  }, []);

  function handleRegister(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    registerProfile(username)
      .then(function(profile) {
        setActiveProfile(profile);
        setActiveProfileState(profile);
        setUsername('');
        return loadProfiles();
      })
      .catch(function(err) {
        setError(err.message || 'Could not register profile.');
      })
      .finally(function() {
        setIsSaving(false);
      });
  }

  function handleUseProfile(profile) {
    setActiveProfile(profile);
    setActiveProfileState(profile);
    setError('');
  }

  return (
    <main className="homeContainer" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', paddingTop: '20px', margin: '0', paddingBottom: '20px' }}>
        Profiles
      </h1>

      <form onSubmit={handleRegister} style={{ display: 'flex', gap: '10px', justifyContent: 'center', paddingBottom: '20px' }}>
        <input
          type="text"
          value={username}
          onChange={function(event) { setUsername(event.target.value); }}
          placeholder="Create profile username"
          minLength={3}
          maxLength={40}
          required
          style={{ padding: '10px', minWidth: '260px' }}
        />
        <button type="submit" disabled={isSaving} style={{ padding: '10px 14px', cursor: 'pointer' }}>
          {isSaving ? 'Creating...' : 'Register'}
        </button>
      </form>

      {activeProfile && (
        <p style={{ textAlign: 'center', marginTop: '0', marginBottom: '20px' }}>
          Active profile: <strong>{activeProfile.username}</strong>
        </p>
      )}

      {error && <p style={{ textAlign: 'center' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '10px' }}>
        {profiles.map(function(profile) {
          const isActive = activeProfile && activeProfile.id === profile.id;

          return (
            <div
              key={profile.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #ddd',
                padding: '12px',
                borderRadius: '8px',
                background: isActive ? '#edf7ff' : '#fff'
              }}
            >
              <span>{profile.username}</span>
              <button
                type="button"
                onClick={function() { handleUseProfile(profile); }}
                disabled={isActive}
                style={{ padding: '8px 12px', cursor: isActive ? 'default' : 'pointer' }}
              >
                {isActive ? 'Active' : 'Use this profile'}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Profiles;
