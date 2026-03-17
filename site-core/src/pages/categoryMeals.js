import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import RecipeCard from '../components/recipeCard';
import './home.css';

function CategoryMeals() {
  const { name } = useParams(); 

  const [meals, setMeals] = useState([]);

  useEffect(function() {
    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${name}`)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        setMeals(data.meals);
      })
      .catch(function(error) {
      });
  }, [name]);

  return (
    <main className="homeContainer">      
      <div className="recipeGrid">
        {meals.map(function(meal) {
          return (
            <Link 
              to={`/recipe/${meal.idMeal}`} 
              key={meal.idMeal} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <RecipeCard 
                title={meal.strMeal}      
                image={meal.strMealThumb} 
              />
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default CategoryMeals;