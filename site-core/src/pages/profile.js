import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RecipeCard from '../components/recipeCard';
import { getProfileFavorites, removeProfileFavorite } from '../api/favorites';
import { getActiveProfile } from '../api/profiles';
import './home.css';

function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProfile, setActiveProfile] = useState(getActiveProfile());

  useEffect(function() {
    setActiveProfile(getActiveProfile());
    setIsLoading(true);
    getProfileFavorites()
      .then(function(items) {
        setFavorites(items);
      })
      .catch(function(err) {
        setError(err.message || 'Could not load favorites.');
      })
      .finally(function() {
        setIsLoading(false);
      });
  }, []);

  useEffect(function() {
    if (favorites.length === 0) {
      setFavoriteRecipes([]);
      return;
    }

    Promise.all(
      favorites.map(function(item) {
        return fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${item.recipeId}`)
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            return data && data.meals ? data.meals[0] : null;
          })
          .catch(function() {
            return null;
          });
      })
    ).then(function(results) {
      setFavoriteRecipes(results.filter(Boolean));
    });
  }, [favorites]);

  function handleRemove(recipeId) {
    removeProfileFavorite(recipeId)
      .then(function() {
        setFavorites(function(prev) {
          return prev.filter(function(item) {
            return item.recipeId !== String(recipeId);
          });
        });
      })
      .catch(function(err) {
        setError(err.message || 'Could not remove favorite.');
      });
  }

  return (
    <main className="homeContainer">
      <h1 style={{ textAlign: 'center', paddingTop: '20px', margin: '0', paddingBottom: '20px' }}>
        Your Favorite Recipes
      </h1>

      <p style={{ textAlign: 'center', marginTop: '0' }}>
        Active profile: {activeProfile ? activeProfile.username : 'No profile selected'} - <Link to="/profiles">Manage profiles</Link>
      </p>

      {isLoading && <p style={{ textAlign: 'center' }}>Loading favorites...</p>}
      {!isLoading && error && <p style={{ textAlign: 'center' }}>{error}</p>}
      {!isLoading && !error && favoriteRecipes.length === 0 && (
        <p style={{ textAlign: 'center' }}>No favorites yet. Open any recipe and click "Add to favorites".</p>
      )}

      <div className="recipeGrid">
        {favoriteRecipes.map(function(recipe) {
          return (
            <div key={recipe.idMeal} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to={`/recipe/${recipe.idMeal}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <RecipeCard
                  title={recipe.strMeal}
                  image={recipe.strMealThumb}
                />
              </Link>
              <button
                type="button"
                onClick={function() { handleRemove(recipe.idMeal); }}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                Remove from favorites
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Profile;
