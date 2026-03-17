import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import RecipeCard from "../components/recipeCard";
import "./home.css"

function Home() {
    const [categories, setCategories] = useState([]);

    useEffect(function() {
        fetch('https://www.themealdb.com/api/json/v1/1/categories.php').then(function(response) {
        return response.json();
      })
      .then(function(data) {
        const first12Categories = data.categories.slice(0, 12);
        setCategories(first12Categories);
      })

    }, []);


    return(
        <main className="homeContainer">
            <div className="recipeGrid">
                {categories.map(function(category){
                    return(
                        <Link to={`/category/${category.strCategory}`}
                        key={category.idCategory}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <RecipeCard
                                key = {category.idCategory}
                                title = {category.strCategory}
                                image = {category.strCategoryThumb}
                            />
                        </Link>
                    )
                })}
            </div>
        </main>
    )
}

export default Home;