import Header from './components/header';
import Footer from './components/footer';
import Home from './pages/home';
import CategoryMeals from './pages/categoryMeals';
import RecipeDetails from './pages/recipeDetails';
import Profile from './pages/profile';
import Profiles from './pages/profiles';

import { Routes, Route } from 'react-router-dom'; 

import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      
      <Routes>
        
        <Route path="/" element={<Home />} />
        
        <Route path="/category/:name" element={<CategoryMeals />} />
        
        <Route path="/recipe/:id" element={<RecipeDetails />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/profiles" element={<Profiles />} />

      </Routes>

      <Footer />
    </div>
  );
}

export default App;