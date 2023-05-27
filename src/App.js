import React from 'react';
import './App.css';

class RecipeApp extends React.Component {
  constructor(props) {
    super(props);
    const storedRecipes = localStorage.getItem('recipes');
    const storedShoppingList = localStorage.getItem('shoppingList');
    // Clear the stored shopping list
    localStorage.removeItem('shoppingList');

    this.state = {
      recipes: storedRecipes ? JSON.parse(storedRecipes) : {
        Pancakes: ['1 cup Flour', '1 cup Milk', '2 Eggs', '2 tbsp Butter', '1/4 tsp Salt', '1 tbsp Sugar'],
        Salad: ['1 head Lettuce', '2 Tomatoes', '1 Cucumber', '1/2 Onion', '2 tbsp Olive Oil', '1 tbsp Vinegar', 'Salt', 'Pepper'],
      },
      currentRecipe: '',
      shoppingList: {}, // Start with an empty shopping list
  };
}

  componentDidUpdate() {
    localStorage.setItem('recipes', JSON.stringify(this.state.recipes));
    localStorage.setItem('shoppingList', JSON.stringify(this.state.shoppingList));
  }

  handleRecipeChange = (event) => {
    this.setState({ currentRecipe: event.target.value });
  };

  addRecipe = () => {
    const { recipes, currentRecipe } = this.state;

    if (currentRecipe.trim() === '') {
      return;
    }

    const recipeIngredients = recipes[currentRecipe];
    if (recipeIngredients) {
      this.updateShoppingList(recipeIngredients);
    } else {
      const confirmAddRecipe = window.confirm('Recipe not found. Do you want to add it?');
      if (confirmAddRecipe) {
        this.addNewRecipe(currentRecipe);
      }
    }
  };

  updateShoppingList = (ingredients) => {
    const updatedShoppingList = { ...this.state.shoppingList };

    ingredients.forEach((ingredient) => {
      const spaceIndex = ingredient.indexOf(' ');
      const quantity = ingredient.slice(0, spaceIndex);
      const ingredientName = ingredient.slice(spaceIndex + 1);

      let parsedQuantity;
      if (quantity) {
        parsedQuantity = this.parseQuantity(quantity);
      } else {
        parsedQuantity = 1;
      }

      if (updatedShoppingList[ingredientName]) {
        updatedShoppingList[ingredientName] += parsedQuantity;
      } else {
        updatedShoppingList[ingredientName] = parsedQuantity;
      }
    });

    this.setState({
      currentRecipe: '',
      shoppingList: updatedShoppingList,
    });
  };

  addNewRecipe = (recipeName) => {
    const ingredients = window.prompt('Enter the ingredients (separated by commas):');

    if (ingredients) {
      const recipeIngredients = ingredients.split(',').map((ingredient) => ingredient.trim());
      const { recipes } = this.state;

      const updatedRecipes = { ...recipes, [recipeName]: recipeIngredients };
      this.setState({ recipes: updatedRecipes }, () => {
        this.updateShoppingList(recipeIngredients);
      });
    }
  };

  clearShoppingList = () => {
    this.setState({ shoppingList: {} }, () => {
      localStorage.removeItem('shoppingList');
    });
  };

  parseQuantity = (quantity) => {
    if (quantity.includes('/')) {
      const [numerator, denominator] = quantity.split('/');
      return parseFloat(numerator) / parseFloat(denominator);
    }
    return parseFloat(quantity);
  };

  render() {
    const { currentRecipe, shoppingList, recipes } = this.state;
  
    return (
      <div>
        <h1>Recipe App</h1>
        <div>
          <input type="text" value={currentRecipe} onChange={this.handleRecipeChange} />
          <button onClick={this.addRecipe}>Add Recipe</button>
        </div>
        <div>
          <h2>Shopping List</h2>
          {Object.keys(shoppingList).length === 0 ? (
            <p>No items in the shopping list</p>
          ) : (
            <div>
              <ul>
                {Object.entries(shoppingList).map(([ingredient, quantity], index) => (
                  <li key={index}>
                    {quantity} {ingredient}
                  </li>
                ))}
              </ul>
              <button onClick={this.clearShoppingList}>Clear Shopping List</button>
            </div>
          )}
        </div>
        <div className="recipe-container">
          <div className="stored-recipes">
            <h2>Stored Recipes</h2>
            {Object.keys(recipes).length === 0 ? (
              <p>No recipes stored</p>
            ) : (
              <div>
                {Object.keys(recipes).map((recipeName, index) => (
                  <div
                    key={index}
                    className="recipe-box"
                    onClick={() => this.updateShoppingList(recipes[recipeName])}
                  >
                    {recipeName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default RecipeApp;