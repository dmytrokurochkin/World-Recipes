import "./header.css"

function Header() {
    return (
    <header>
        <div className="headerContainer">
            <div className="headerLeft">
                <a href="#">Home</a>
                <a href="#">Random Recipe</a>
            </div>
            <div className="siteName">
                <h2>
                    WORLD RECIPES
                </h2>
            </div>
            <div className="headerRight">
                <input 
                    type="text" 
                    placeholder="Search recipes..." 
                    className="searchInput" 
                />
                <a href="#">Favorites</a>
                <a href="#">Login</a>
            </div>
        </div>
    </header>
    )
}
export default Header