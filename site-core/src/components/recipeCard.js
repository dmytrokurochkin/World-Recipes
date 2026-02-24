import "./recipeCard.css"

function RecipeCard(props) {
    return (
        <div className="recipeCard">
            <img src={props.image} alt={props.title}/>
            <div className="recipeInfo">
                <h3>{props.title}</h3>
            </div>
        </div>
        
    )
}

export default RecipeCard