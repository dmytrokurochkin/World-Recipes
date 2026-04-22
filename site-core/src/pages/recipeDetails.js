import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RecipeCard from '../components/recipeCard'; 
import { addProfileFavorite, getProfileFavorites, removeProfileFavorite } from '../api/favorites';
import './home.css'; 

function roundForCooking(value) {
  if (value >= 100) {
    return Math.round(value / 10) * 10;
  } else if (value >= 10) {
    return Math.round(value / 5) * 5;
  } else {
    return Math.round(value);
  }
}

function parseQuantity(str) {
  let total = 0;
  const parts = str.trim().split(/\s+/);
  
  for (let part of parts) {
    if (part.includes('/')) {
      const [nom, den] = part.split('/');
      if (!isNaN(nom) && !isNaN(den) && den !== '0') {
        total += parseInt(nom) / parseInt(den);
      }
    } else if (!isNaN(part)) {
      total += parseFloat(part);
    }
  }
  return total;
}

function convertToMetric(measureText) {
  if (!measureText) return "";

  const regex = /([\d\s./]+)\s*(lb|lbs|oz|cup|cups)\b/gi;

  let convertedText = measureText.replace(regex, function(match, numberPart, unit) {
    const num = parseQuantity(numberPart);
    if (num === 0) return match;

    let metricValue = 0;
    let metricUnit = '';
    const lowerUnit = unit.toLowerCase();

    if (lowerUnit === 'lb' || lowerUnit === 'lbs') {
      metricValue = num * 453.592;
      metricUnit = 'g';
    } else if (lowerUnit === 'oz') {
      metricValue = num * 28.3495;
      metricUnit = 'g';
    } else if (lowerUnit === 'cup' || lowerUnit === 'cups') {
      metricValue = num * 240;
      metricUnit = 'ml';
    }

    const finalValue = roundForCooking(metricValue);
    return `${finalValue}${metricUnit}`;
  });

  return convertedText.charAt(0).toUpperCase() + convertedText.slice(1);
}
function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(function() {
    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        setRecipe(data.meals[0]); 
      });
  }, [id]);

  useEffect(function() {
    setFavoriteError('');
    getProfileFavorites()
      .then(function(favorites) {
        const found = favorites.some(function(item) {
          return item.recipeId === String(id);
        });
        setIsFavorite(found);
      })
      .catch(function(err) {
        setFavoriteError(err.message || 'Could not load favorite state.');
      });
  }, [id]);

  function handleFavoriteClick() {
    setIsFavoriteLoading(true);
    setFavoriteError('');

    const action = isFavorite
      ? removeProfileFavorite(id)
      : addProfileFavorite(id);

    action
      .then(function() {
        setIsFavorite(!isFavorite);
      })
      .catch(function(err) {
        setFavoriteError(err.message || 'Favorite action failed.');
      })
      .finally(function() {
        setIsFavoriteLoading(false);
      });
  }

  if (!recipe) {
    return <h2 style={{textAlign: 'center', marginTop: '50px'}}>Loading...</h2>;
  }

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim() !== '') {
      
      const originalMeasure = recipe[`strMeasure${i}`];
      const metricMeasure = convertToMetric(originalMeasure);

      ingredients.push({
        name: recipe[`strIngredient${i}`],
        measure: metricMeasure
      });
    }
  }

  return (
    <main className="homeContainer">
      <h1 style={{ textAlign: 'center', paddingTop: '20px', margin: '0', paddingBottom: '20px' }}>
        {recipe.strMeal} - Ingredients
      </h1>

      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isFavoriteLoading}
          style={{ padding: '10px 14px', cursor: 'pointer' }}
        >
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </button>
        {favoriteError && (
          <p style={{ marginTop: '10px' }}>{favoriteError}</p>
        )}
      </div>

      <div className="recipeGrid">
        {ingredients.map(function(ing, index) {
          return (
            <RecipeCard 
              key={index}
              title={`${ing.measure} ${ing.name}`} 
              image={`https://www.themealdb.com/images/ingredients/${ing.name}.png`} 
            />
          );
        })}
      </div>
    </main>
  );
}

export default RecipeDetails;