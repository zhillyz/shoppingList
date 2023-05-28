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
  }

  handleRecipeChange = (event) => {
    this.setState({ currentRecipe: event.target.value });
  };

    /**
   * Adds an owned ingredient based on user input.
   */
  addOwnedIngredient = () => {
    // Prompt the user to enter the ingredient and quantity
    const ingredient = window.prompt('Enter the ingredient:');
    const quantity = window.prompt('Enter the quantity:');

    if (ingredient && quantity) {
      // Retrieve the shoppingList and ownedIngredients from the state
      const { shoppingList, ownedIngredients } = this.state;
      const updatedShoppingList = { ...shoppingList };
      const updatedOwnedIngredients = { ...ownedIngredients };

      if (updatedShoppingList[ingredient]) {
        // If the ingredient is already in the shoppingList, remove the quantity from the shoppingList
        const removedQuantity = Math.min(updatedShoppingList[ingredient], parseInt(quantity, 10));
        updatedShoppingList[ingredient] -= removedQuantity;

        if (updatedOwnedIngredients[ingredient]) {
          // If the ingredient is already in the ownedIngredients, update the used and remaining quantities
          updatedOwnedIngredients[ingredient].used += removedQuantity;
          updatedOwnedIngredients[ingredient].remaining -= removedQuantity;
        } else {
          // If the ingredient is not in the ownedIngredients, create a new entry with the used and remaining quantities
          updatedOwnedIngredients[ingredient] = {
            used: removedQuantity,
            remaining: removedQuantity,
          };
        }

        if (updatedShoppingList[ingredient] === 0) {
          // If the shoppingList quantity becomes zero, remove the ingredient from the shoppingList
          delete updatedShoppingList[ingredient];
        }
      } else {
        // If the ingredient is not in the shoppingList, update the ownedIngredients
        if (updatedOwnedIngredients[ingredient]) {
          // If the ingredient is already in the ownedIngredients, update the remaining quantity
          updatedOwnedIngredients[ingredient].remaining += parseInt(quantity, 10);
        } else {
          // If the ingredient is not in the ownedIngredients, create a new entry with the used and remaining quantities
          updatedOwnedIngredients[ingredient] = {
            used: 0,
            remaining: parseInt(quantity, 10) - (updatedOwnedIngredients[ingredient]?.used || 0),
          };
        }
      }

      // Update the state with the updated shoppingList, ownedIngredients, and trigger the updateShoppingListFromOwned function
      this.setState(
        {
          shoppingList: updatedShoppingList,
          ownedIngredients: updatedOwnedIngredients,
        },
        () => {
          this.updateShoppingListFromOwned();
        }
      );
    }
  };


  handleStoredRecipeClick = (recipeName) => {
    const { recipes } = this.state;
    const recipeIngredients = recipes[recipeName];
    if (recipeIngredients) {
      this.updateShoppingList(recipeIngredients);
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

  updateShoppingList = (ingredients) => {
    // Retrieve the ownedIngredients and shoppingList from the state
    const { ownedIngredients } = this.state;
    const updatedShoppingList = { ...this.state.shoppingList };
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
      const remainingQuantity = parsedQuantity - ownedQuantity;
  
      // Update the shopping list if there's still a need for the ingredient
      if (remainingQuantity > 0) {
        updatedShoppingList[ingredientName] = (updatedShoppingList[ingredientName] || 0) + remainingQuantity;
      }
  
      // Update owned ingredient quantities
      if (ownedQuantity > 0) {
        updatedOwnedIngredients[ingredientName].remaining = Math.max(0, remainingQuantity);
        updatedOwnedIngredients[ingredientName].used = Math.max(0, parsedQuantity);
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
        // After updating the state, trigger the updateShoppingListFromOwned function
        this.updateShoppingListFromOwned();
      }
    );
  };

  /**
 * Updates the shopping list based on the owned ingredients.
 */
updateShoppingListFromOwned = () => {
  // Destructure the shoppingList and ownedIngredients from the state
  const { shoppingList, ownedIngredients } = this.state;

  // Create copies of the original shoppingList and ownedIngredients
  const updatedShoppingList = { ...shoppingList };
  const updatedOwnedIngredients = { ...ownedIngredients };

  // Iterate over each owned ingredient
  for (const [ingredient, quantity] of Object.entries(ownedIngredients)) {
    // Destructure the used and remaining quantities from the current ingredient
    const { used, remaining } = quantity;

    // Check if the ingredient is already in the shoppingList
    if (shoppingList[ingredient]) {
      // Calculate the remaining quantity of the ingredient
      const remainingQuantity = Math.max(shoppingList[ingredient] - used, 0);

      // Update the owned ingredient with the used and remaining quantities
      updatedOwnedIngredients[ingredient] = {
        used,
        remaining: remainingQuantity,
      };

      // If the remaining quantity is zero or less, remove the ingredient from the shoppingList
      if (remainingQuantity <= 0) {
        delete updatedShoppingList[ingredient];
      }
    } else {
      // If the ingredient is not in the shoppingList, update the owned ingredient with the used and remaining quantities
      updatedOwnedIngredients[ingredient] = {
        used,
        remaining,
      };
    }
  }

  // Update the state with the updated shoppingList and ownedIngredients
  this.setState({
    shoppingList: updatedShoppingList,
    ownedIngredients: updatedOwnedIngredients,
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
                className={quantity.used > 0 ? 'red' : 'green'}
              />
              <input
                type="number"
                value={quantity.remaining}
                onChange={(event) => this.handleOwnedIngredientRemainingChange(event, ingredient)}
                className={quantity.used > 0 ? 'red' : 'green'}
              />
              <button onClick={() => this.removeOwnedIngredient(ingredient)}>Remove</button>
            </div>
          );
        })}
      </div>
    );
  };
 
  
  handleAddRecipe = (recipe) => {
    const { shoppingList } = this.state;
    const updatedShoppingList = { ...shoppingList };
  
    recipe.ingredients.forEach((ingredient) => {
      const { name, quantity } = ingredient;
  
      if (updatedShoppingList[name]) {
        updatedShoppingList[name] += quantity;
      } else {
        updatedShoppingList[name] = quantity;
      }
    });
  
    this.setState({ shoppingList: updatedShoppingList });
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
};

  
  renderShoppingList = () => {
    const { shoppingList, ownedIngredients } = this.state;

    return Object.keys(shoppingList).map((ingredientName, index) => {
      const shoppingQuantity = shoppingList[ingredientName];
      const ownedQuantity = ownedIngredients[ingredientName]?.quantity || 0;
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
              <div>
                {Object.keys(recipes).map((recipeName, index) => (
                  <div key={index} className="recipe-box">
                    <span className="recipe-name">{recipeName}</span>
                    <button className="add-button" onClick={() => this.handleStoredRecipeClick(recipeName)}>
                      Add to Shopping List
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
          </div>
        </div>
      </div>
    );
  }
  
  
}

export default RecipeApp;