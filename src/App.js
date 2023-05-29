import React from 'react';
import './App.css';

class RecipeApp extends React.Component {
  constructor(props) {
    super(props);
    const storedRecipes = localStorage.getItem('recipes');
    const storedShoppingList = localStorage.getItem('shoppingList');
    const storedOwnedIngredients = localStorage.getItem('ownedIngredients');

    this.state = {
      recipes: storedRecipes ? JSON.parse(storedRecipes) : {
        Pancakes: ['1 cup Flour', '1 cup Milk', '2 Eggs', '2 tbsp Butter', '1/4 tsp Salt', '1 tbsp Sugar'],
        Salad: ['1 head Lettuce', '2 Tomatoes', '1 Cucumber', '1/2 Onion', '2 tbsp Olive Oil', '1 tbsp Vinegar', 'Salt', 'Pepper'],
      },
      currentRecipe: '',
      shoppingList: storedShoppingList ? JSON.parse(storedShoppingList) : {},
      ownedIngredients: storedOwnedIngredients ? JSON.parse(storedOwnedIngredients) : {},
    };
  }

  componentDidUpdate() {
    localStorage.setItem('recipes', JSON.stringify(this.state.recipes));
    localStorage.setItem('shoppingList', JSON.stringify(this.state.shoppingList));
    localStorage.setItem('ownedIngredients', JSON.stringify(this.state.ownedIngredients));
  };

  handleRecipeChange = (event) => {
    this.setState({ currentRecipe: event.target.value });
  };

  containsNumberAndIngredient(input) {
    const regex = /^\d+(\.\d+)?\s+\w+/; // Matches a number followed by a space and a word character (\w)
    return regex.test(input);
  };
  
  // Function to prompt user for input
  getUserInput() {
    const userInput = prompt('Enter an ingredient or a quantity followed by an ingredient:');
  
    if (this.containsNumberAndIngredient(userInput)) {
      // If the input contains a number followed by an ingredient
      const match = userInput.match(/^(\d+(\.\d+)?)\s+(.+)/); // Match the quantity and ingredient
      if (match) {
        const quantity = parseFloat(match[1]); // Extract the quantity
        const ingredient = match[3].trim(); // Extract the ingredient and remove leading/trailing spaces
        return { quantity, ingredient };
      }
    } else {
      // If the input is just an ingredient
      const quantity = parseFloat(prompt('Enter the quantity for the ingredient:'));
      return { quantity, ingredient: userInput.trim() }; // Remove leading/trailing spaces from the ingredient
    }
    
    // If the input format is invalid or the user cancels the prompt
    return null;
  };
  
  

  /**
   * Adds an owned ingredient based on user input.
   */
  addOwnedIngredient = () => {
    // Prompt the user to enter the ingredient and quantity
    const getUserInput = this.getUserInput();
    const quantity = getUserInput.quantity;
    const ingredient = getUserInput.ingredient.toLowerCase().trim(); // Convert to lowercase and remove leading/trailing spaces
    
    if (ingredient && quantity) {
      // Retrieve the shoppingList and ownedIngredients from the state
      const { shoppingList, ownedIngredients } = this.state;
      const updatedShoppingList = { ...shoppingList };
      const updatedOwnedIngredients = { ...ownedIngredients };
    
      // Function to handle pluralization of ingredient names
      const handlePluralization = (ingredient) => {
        // Remove the "s" at the end if it exists
        if (ingredient.endsWith('s')) {
          return ingredient.slice(0, -1);
        }
        return ingredient;
      };
    
      // Check if the ingredient exists in ownedIngredients using case-insensitive comparison
      const existingIngredient = Object.keys(updatedOwnedIngredients).find((key) =>
        handlePluralization(key.toLowerCase().trim()) === ingredient
      );
    
      if (existingIngredient) {
        // If the ingredient is already in the ownedIngredients, update the remaining quantity
        updatedOwnedIngredients[existingIngredient].remaining += parseFloat(quantity);
      } else {
        // If the ingredient is not in the ownedIngredients, create a new entry with the used and remaining quantities
        updatedOwnedIngredients[ingredient] = {
          used: 0,
          remaining: parseFloat(quantity),
        };
      }
    
      // Check if the ingredient exists in shoppingList using case-insensitive comparison
      const matchingIngredient = Object.keys(updatedShoppingList).find((key) =>
        handlePluralization(key.toLowerCase().trim()) === ingredient
      );
    
      if (matchingIngredient) {
        // Calculate the remaining quantity needed for the shopping list
        const neededQuantity = Math.max(updatedShoppingList[matchingIngredient] - updatedOwnedIngredients[matchingIngredient].remaining, 0);
        const oldRemaining = updatedOwnedIngredients[matchingIngredient].remaining;
        const oldUsed = updatedOwnedIngredients[matchingIngredient].used;
    
        if (neededQuantity > 0) {
          // Update the shopping list if there's still a need for the ingredient
          updatedShoppingList[matchingIngredient] = neededQuantity;
          updatedOwnedIngredients[matchingIngredient] = {
            used: oldUsed + oldRemaining,
            remaining: 0,
          };
        } else {
          // If the needed quantity is zero or less, remove the ingredient from the shopping list
          updatedOwnedIngredients[matchingIngredient] = {
            used: oldUsed + updatedShoppingList[matchingIngredient],
            remaining: oldRemaining - updatedShoppingList[matchingIngredient],
          };
          delete updatedShoppingList[matchingIngredient];
        }
      }
    
      // Update the state with the updated shoppingList and ownedIngredients
      this.setState({
        shoppingList: updatedShoppingList,
        ownedIngredients: updatedOwnedIngredients,
      });
    }
  };
  

  handleStoredRecipeClick = (recipeName) => {
    const { recipes } = this.state;
    const recipeIngredients = recipes[recipeName];
    if (recipeIngredients) {
      this.updateShoppingListFromRecipe(recipeIngredients);
    }
  };
  
  deleteRecipe = (recipeName) => {
    const { recipes } = this.state;
    const updatedRecipes = { ...recipes };
    delete updatedRecipes[recipeName];
    this.setState({ recipes: updatedRecipes });
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

  
  handleEditRecipe = (recipeName) => {
    // Retrieve the recipes from the state
    const { recipes } = this.state;

    // Prompt the user to enter the updated recipe name and ingredients
    const updatedRecipeName = window.prompt('Enter the updated recipe name:', recipeName);
    const updatedRecipeIngredients = window.prompt('Enter the updated recipe ingredients (separated by commas):', recipes[recipeName].join(', '));

    if (updatedRecipeName && updatedRecipeIngredients) {
      // Split the ingredients by commas and trim any leading/trailing spaces
      const ingredients = updatedRecipeIngredients.split(',').map((ingredient) => ingredient.trim());

      // Create a copy of the recipes object and update the recipe with the new name and ingredients
      const updatedRecipes = { ...recipes, [updatedRecipeName]: ingredients };

      // Remove the original recipe if the name has changed
      if (recipeName !== updatedRecipeName) {
        delete updatedRecipes[recipeName];
      }

      // Update the state with the updated recipes
      this.setState({ recipes: updatedRecipes });
    }
  };

  updateShoppingListFromRecipe = (ingredients) => {
    // Retrieve the ownedIngredients and shoppingList from the state
    const { ownedIngredients,shoppingList } = this.state;
    const updatedShoppingList = { ...shoppingList };
    const updatedOwnedIngredients = { ...ownedIngredients };
  
    // Loop through each ingredient
    ingredients.forEach((ingredient) => {
      const spaceIndex = ingredient.indexOf(' ');
      let quantity;
      let ingredientName;
  
      // Check if the ingredient has a quantity specified or not
      if (spaceIndex === -1) {
        // Default quantity is 1 if not specified
        quantity = '1';
        ingredientName = ingredient;
      } else {
        // Extract the quantity and ingredient name from the string
        quantity = ingredient.slice(0, spaceIndex);
        ingredientName = ingredient.slice(spaceIndex + 1);
      }
  
      // Parse the quantity to a numeric value
      const parsedQuantity = this.parseQuantity(quantity);
      const ownedQuantity = ownedIngredients[ingredientName]?.remaining || 0;
  
      // Calculate the remaining quantity needed for the ingredient
      const neededQuantity = parsedQuantity - ownedQuantity;
  
      // Update the shopping list if there's still a need for the ingredient
      if (neededQuantity > 0) {
        updatedShoppingList[ingredientName] = (updatedShoppingList[ingredientName] || 0) + neededQuantity;
      }
  
      // Update owned ingredient quantities
      if (ownedQuantity > 0 && neededQuantity < 0) {
        updatedOwnedIngredients[ingredientName].remaining = Math.abs(neededQuantity);
        updatedOwnedIngredients[ingredientName].used += parsedQuantity;
      } else if (ownedQuantity > 0){
        updatedOwnedIngredients[ingredientName].used += updatedOwnedIngredients[ingredientName].remaining
        updatedOwnedIngredients[ingredientName].remaining = 0;
      }
      
    });
  
    // Update the state with the updated shopping list, owned ingredients, and current recipe
    this.setState(
      {
        currentRecipe: '',
        shoppingList: updatedShoppingList,
        ownedIngredients: updatedOwnedIngredients,
      },
      () => {
        // After updating the state, trigger the renderShoppingList function
        this.renderShoppingList();
      }
    );
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
    this.setState({ shoppingList: {} });
  };

  parseQuantity = (quantity) => {
    if (quantity.trim() === '') {
      return 1; // Default to 1 if no quantity is provided
    }

    if (quantity.includes('/')) {
      const [numerator, denominator] = quantity.split('/');
      return parseFloat(numerator) / parseFloat(denominator);
    }

    return parseFloat(quantity);
  };

  removeOwnedIngredient = (ingredient) => {
    const { ownedIngredients } = this.state;
    const updatedIngredients = { ...ownedIngredients };
  
    delete updatedIngredients[ingredient];
  
    this.setState({ ownedIngredients: updatedIngredients });
  };

  renderOwnedIngredients = () => {
    const { ownedIngredients } = this.state;
  
    return (
      <div>
        {Object.entries(ownedIngredients).map(([ingredient, quantity], index) => {
          return (
            <div key={index} className="owned-ingredient">
              <div className="ingredient">{ingredient}</div>
              <input
                type="number"
                value={quantity.used}
                onChange={(event) => this.handleOwnedIngredientUsedChange(event, ingredient)}
                className='red'
              />
              <input
                type="number"
                value={quantity.remaining}
                onChange={(event) => this.handleOwnedIngredientRemainingChange(event, ingredient)}
                className='green'
              />
              <button onClick={() => this.removeOwnedIngredient(ingredient)}>Remove</button>
            </div>
          );
        })}
      </div>
    );
  };  

  handleOwnedIngredientUsedChange = (event, ingredient) => {
    const { ownedIngredients } = this.state;
    const used = event.target.value.trim() === '' ? 0 : parseInt(event.target.value, 10);
    const updatedOwnedIngredients = {
      ...ownedIngredients,
      [ingredient]: {
        ...ownedIngredients[ingredient],
        used,
      },
    };
  
    this.setState({ ownedIngredients: updatedOwnedIngredients });
  };

  
  handleOwnedIngredientChange = (event, ingredient) => {
    const { ownedIngredients } = this.state;
    const quantity = event.target.value.trim() === '' ? '' : parseInt(event.target.value, 10);
  
    const updatedOwnedIngredients = {
      ...ownedIngredients,
      [ingredient]: {
        ...ownedIngredients[ingredient],
        remaining: quantity, // Update the `remaining` property instead of the whole ingredient value
      },
    };
  
    // Calculate the new used quantity based on the updated remaining quantity
    const currentQuantity = updatedOwnedIngredients[ingredient];
    if (currentQuantity) {
      const newUsed = Math.max(currentQuantity.used - currentQuantity.remaining + quantity, 0);
      currentQuantity.used = newUsed;
    }
  
    this.setState({ ownedIngredients: updatedOwnedIngredients }, () => {
      this.updateShoppingListFromOwned();
    });
  };

  /**
   * Handles the change event for the remaining quantity of an owned ingredient.
   * @param {Event} event - The change event object.
   * @param {string} ingredient - The name of the ingredient being updated.
   */
  handleOwnedIngredientRemainingChange = (event, ingredient) => {
    // Retrieve the ownedIngredients from the state
    const { ownedIngredients } = this.state;

    // Extract the remaining quantity value from the event target
    const remaining = event.target.value.trim() === '' ? 0 : parseInt(event.target.value, 10);

    // Create a copy of the ownedIngredients with the updated remaining quantity for the specified ingredient
    const updatedOwnedIngredients = {
      ...ownedIngredients,
      [ingredient]: {
        ...ownedIngredients[ingredient],
        remaining,
      },
    };

    // Update the state with the updated ownedIngredients
    this.setState({ ownedIngredients: updatedOwnedIngredients });
    this.renderShoppingList()
  };

  updateOwnedIngredientsExit = () => {
    const { ownedIngredients } = this.state;
    const updatedOwnedIngredients = { ...ownedIngredients };
  
    Object.keys(updatedOwnedIngredients).forEach(key => {
      updatedOwnedIngredients[key].used = 0;
    });
  
    this.setState({
      ownedIngredients: updatedOwnedIngredients,
    });
    window.close()
  };
  

  renderShoppingList = () => {
    const { shoppingList, ownedIngredients } = this.state;

    return Object.keys(shoppingList).map((ingredientName, index) => {
      const shoppingQuantity = shoppingList[ingredientName];
      const ownedQuantity = ownedIngredients[ingredientName]?.remaining|| 0;
      const remainingQuantity = shoppingQuantity - ownedQuantity;

      if (remainingQuantity <= 0) {
        return null; // Skip rendering if the ingredient is fully owned
      }

      return (
        <div key={index}>
          {remainingQuantity} {ingredientName}
        </div>
      );
    });
  };

  toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  render() {
    const { currentRecipe, shoppingList, recipes, ownedIngredients } = this.state;
  
    return (
      <div className="center-container">
        <h1>Recipe App</h1>
        <div className="add-receipe-container">
          <input type="text" value={currentRecipe} onChange={this.handleRecipeChange} />
          <button onClick={this.addRecipe}>Add Recipe</button>
        </div>
        <div className="shopping-list">
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
              <div className='recipe-list'>
                {Object.keys(recipes).map((recipeName, index) => (
                  <div key={index} className="recipe-box">
                    <span className="recipe-name">{this.toTitleCase(recipeName)}</span>
                    <button className="add-button" onClick={() => this.handleStoredRecipeClick(recipeName)}>
                      Add to Shopping List
                    </button>
                    <button className="edit-button" onClick={() => this.handleEditRecipe(recipeName)}>
                      <i className="fas fa-cog"></i>
                    </button>
                    <button className="delete-button" onClick={() => this.deleteRecipe(recipeName)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="owned-ingredients">
            <h2>Owned Ingredients</h2>
              <div className="owned-ingredient">
                <div className="ingredient-heading">Ingredient</div>
                <div className="quantity-heading">Used</div>
                <div className="quantity-heading">Remaining</div>
                <div className="action-heading">Action</div>
              </div>
            {this.renderOwnedIngredients()} {/* Render owned ingredients using the method */}
            <button onClick={this.addOwnedIngredient}>Add Ingredient</button>
            <button onClick={this.updateOwnedIngredientsExit}>Save updated owned ingredients and exit.</button>
          </div>
        </div>
      </div>
    );
  }
  
  
}

export default RecipeApp;