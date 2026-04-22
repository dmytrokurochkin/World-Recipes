import Header from './components/Header';
import Footer from './components/footer';
import Home from './pages/home';
import CategoryMeals from './pages/categoryMeals';
import RecipeDetails from './pages/recipeDetails';

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

      </Routes>

      <Footer />
    </div>
  );
}

export default App;