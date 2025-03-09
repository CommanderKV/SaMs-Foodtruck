import { Router } from 'express';
import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';

// Handle creating errors
function sendError(res, error, message) {
    if (error instanceof Error == false) {
        return res.status(error.code).json({
            status: "failure",
            message: error.message
        });
    } else {
        console.log(`${message} --ERROR-- ${error}`);
        return res.status(500).json({
            status: "failure",
            message: message
        });
    }
}

// GET: /
async function getAllProducts(req, res) {
    try {
        // Get all menu items
        const menuItems = await db.products.findAll({
            include: [
                {
                    model: db.ingredients,
                    as: "ingredients",
                    through: {
                        attributes: ["quantity", "measurement"]
                    },
                    attributes: ["name", "description", "price", "photo"]
                },
                {
                    model: db.categories,
                    as: "categories",
                }
            ]
        });

        // Send response
        res.status(200).json({
            status: "success",
            data: menuItems
        });
    } catch (error) {
        console.log(`Failed to get menu items ${error}`);
        res.status(500).json({
            status: "failure",
            message: "Failed to retrieve menu items"
        });
    }
};

// GET: /:id
async function getProductById(req, res) {
    try {
        const productId = req.params.id;

        // Check if the product ID is valid
        if (isNaN(productId) || productId <= 0) {
            throw {code: 400, message: "Invalid product ID"};
        }

        // Get the product details
        const product = await db.products.findOne({ where: { id: productId } });
        if (!product) {
            throw {code: 404, message: "Product not found"}
        }

        // Get the ingredients
        product.ingredients = await db.ingredientsToProducts.findAll({ where: { productId: productId } });

        // Return the product details
        res.status(200).json({
            status: "success",
            data: product
        });
    } catch (error) {
        return sendError(res, error, "Failed to get product by ID");
    }
};

// Check all product details
function checkProductDetails(productDetails) {
    // Check if the name is set
    if (productDetails.name != undefined) {
        if (typeof productDetails.name !== "string") {
            throw {code: 400, message: "Name must be a string"};
        }
        if (productDetails.name.trim() === "") {
            throw {code: 400, message: "Name must not be empty"};
        }
    } else {throw {code: 400, message: "Name is required"};}
    
    // Check if the description is set
    if (productDetails.description != undefined) {
        if (typeof productDetails.description !== "string") {
            throw {code: 400, message: "Description must be a string"};
        }
        if (productDetails.description.trim() === "") {
            throw {code: 400, message: "Description must not be empty"};
        }
    } else {throw {code: 400, message: "Description is required"};}

    // Check if the price is set
    if (productDetails.price != undefined) {
        if (typeof productDetails.price !== "number") {
            throw {code: 400, message: "Price must be a decimal number"};
        }
        if (productDetails.price <= 0) {
            throw {code: 400, message: "Price must be greater than 0"};
        }
    } else {
        throw {code: 400, message: "Price is required"};
    }

    // Check if the photo is set
    if (productDetails.photo != undefined) {
        if (typeof productDetails.photo !== "string") {
            throw {code: 400, message: "Photo must be a string"};
        }
        if (productDetails.photo.trim() === "") {
            throw {code: 400, message: "Photo must not be empty"};
        }
    }else {
        throw {code: 400, message: "Photo is required"};
    }
}

// Check all ingredient details
async function checkIngredientDetails(ingredients) {
    // Make sure ingredients are arrays
    if (!Array.isArray(ingredients)) {
        throw {code: 400, message: "Ingredients must be an array"};
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw {code: 400, message: "Ingredient ID must be a number"};
            }
            if (ingredient.id <= 0) {
                throw {code: 400, message: "Invalid ingredient ID"};
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw {code: 404, message: "Ingredient not found"};
            }
        } else {
            throw {code: 400, message: "Ingredient ID is required"};
        }

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw {code: 400, message: "Ingredient quantity must be a number"};
            }
            if (ingredient.quantity <= 0) {
                throw {code: 400, message: "Ingredient quantity must be greater than 0"};
            }
        } else {throw {code: 400, message: "Ingredient quantity is required"};}

        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (ingredient.measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        } else {throw {code: 400, message: "Ingredient measurement is required"};}
    }
}

// POST: /create
async function createProduct(req, res) {
    try {
        const newProductDetails = req.body;

        /////////////////////////////////
        //  Check for product details  //
        /////////////////////////////////
        checkProductDetails(newProductDetails);

        // Add photo to the images folder
        // Must be a base64Encoded string
        let photoPath = await savePhoto(newProductDetails.photo);

        // Create new product
        const newProduct = await db.products.create({
            name: newProductDetails.name,
            description: newProductDetails.description,
            price: newProductDetails.price,
            photo: photoPath
        });


        /////////////////////////////
        //  Check for ingredients  //
        /////////////////////////////
        if (newProductDetails.ingredients != undefined && Array.isArray(newProductDetails.ingredients)) {
            const ingredients = newProductDetails.ingredients;
            
            // Check each ingredient details
            await checkIngredientDetails(ingredients);

            // Create Ingredient Links
            await db.ingredientsToProducts.bulkCreate(
                ingredients.map(ingredient => ({
                    productId: newProduct.id,
                    ingredientId: ingredient.id,
                    quantity: ingredient.quantity,
                    measurement: ingredient.measurement
                }))
            );
        }

        // Send response
        res.status(201).json({
            status: "success",
            data: newProduct
        });

    // Catch any errors
    } catch (error) {
        return sendError(res, error, "Failed to create product");
    }
};

// Check for an id and return updatedProducts
async function getUpdatedProduct(updatedProductDetails, id) {
    // Check to make sure a product id is given
    if (updatedProductDetails.id != undefined || id != undefined) {
        if (typeof updatedProductDetails.id !== "number" || typeof id !== "number") { 
            throw {code: 400, message: "Product ID must be a number"}; 
        }
        if (updatedProductDetails.id <= 0 || id <= 0) { 
            throw {code: 400, message: "Invalid product ID"}; 
        }
        if (updatedProductDetails.id != id) {
            throw {code: 400, message: "Product ID mismatch"};
        }

        const foundProduct = await db.products.findByPk(updatedProductDetails.id);
        if (!foundProduct) {
            throw {code: 404, message: "Product not found"};
        }
    } else { 
        throw {code: 400, message: "Product ID is required"}; 
    }

    // Create updated product values
    let updatedProduct = {};
    for (const key in updatedProductDetails) {
        if (updatedProductDetails[key] != undefined && (key != "id" || key != "photo")) {
            updatedProduct[key] = updatedProductDetails[key];
        }
    }
    if (updatedProductDetails.photo != undefined) {
        updatedProduct.photo = await savePhoto(updatedProductDetails.photo);
    }

    return updatedProduct;
}

async function checkIngredientDetailsForUpdate(ingredients) {
    // Make sure ingredients are arrays
    if (!Array.isArray(ingredients)) {
        throw {code: 400, message: "Ingredients must be an array"};
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw {code: 400, message: "Ingredient ID must be a number"};
            }
            if (ingredient.id <= 0) {
                throw {code: 400, message: "Invalid ingredient ID"};
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw {code: 404, message: "Ingredient not found"};
            }
        } else {throw {code: 400, message: "Ingredient ID is required"};}

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw {code: 400, message: "Ingredient quantity must be a number"};
            }
            if (ingredient.quantity <= 0) {
                throw {code: 400, message: "Ingredient quantity must be greater than 0"};
            }
        }

        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (ingredient.measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        }
        
        if (ingredient.quantity === undefined && ingredient.measurement === undefined){
            throw {code: 400, message: "Ingredient needs quantity or measurement"};
        }
    }
}

async function checkCategories(categories) {
    // Check if we have either of th proper keys
    if (categories.add == undefined && categories.remove == undefined) {
        throw {code: 400, message: "Categories must have either add or remove options"};
    }
    
    // Check if the add key is an array
    if (categories.add != undefined) {
        if (!Array.isArray(categories.add)) {
            throw {code: 400, message: "Add categories must be an array"};
        }
        
        // Check to make sure all values are numbers
        for (const category of categories.add) {
            if (typeof category !== "number") {
                throw {code: 400, message: "Category ID must be a number"};
            }
            if (category <= 0) {
                throw {code: 400, message: "Invalid category ID"};
            }

            // Check to see if the category exists
            const foundCategory = await db.categories.findOne({ where: { id: category } });
            if (!foundCategory) {
                throw {code: 404, message: `Category with ${category} id not found`};
            }
        }
    }

    // Check if the remove key is an array
    if (categories.remove != undefined) {
        if (!Array.isArray(categories.remove)) {
            throw {code: 400, message: "Remove categories must be an array"};
        }

        // Check to make sure all values are numbers
        for (const category of categories.remove) {
            if (typeof category !== "number") {
                throw {code: 400, message: "Category ID must be a number"};
            }
            if (category <= 0) {
                throw {code: 400, message: "Invalid category ID"};
            }

            // Check to see if the category exists
            const foundCategory = await db.categories.findOne({ where: { id: category } });
            if (!foundCategory) {
                throw {code: 404, message: `Category with ${category} id not found`};
            }
        }
    }

    return categories;
}

// PUT: /update/:id
async function updateProduct (req, res) {
    try {
        const updatedProductDetails = req.body;
        const productId = req.params.id !== undefined ? Number(req.params.id) : undefined;
        
        /////////////////////////////
        //  Check body parameters  //
        /////////////////////////////
        // Get the updated product
        const updatedProduct = await getUpdatedProduct(updatedProductDetails, productId);

        // Check the ingredients
        if (updatedProductDetails.ingredients != undefined) {
            await checkIngredientDetailsForUpdate(updatedProductDetails.ingredients)
        }

        // If the product doesn't need to be updated
        // then don't touch the product
        const product = await db.products.findByPk(updatedProductDetails.id);
        if (Object.keys(updatedProduct).length !== 0) {
            // Update product parameters
            await db.products.update(
                updatedProduct, 
                { 
                    where: { 
                        id: updatedProductDetails.id
                    } 
                }
            );
            await product.save();
        }

        // Update ingredients
        if (updatedProductDetails.ingredients != undefined) {
            // Structure
            // ingredients: [
            //     {
            //          id: 1,
            //          quantity: 1, Optional
            //          measurement: "cup", Optional
            //          remove: true Optional
            //     },
            //     ...
            // ]
            const ingredients = await product.getIngredients();

            // Create a map of ingredients
            const ingredientLinks = updatedProductDetails.ingredients;
            const updateIngredients = ingredientLinks.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});
            const prevIngredients = ingredients.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});

            // Loop through the updated ingredients
            for (const id of Object.keys(updateIngredients)) {
                const updateIngredient = updateIngredients[id];

                // Check if we want to remove the ingredient link
                if (updateIngredient.remove != undefined) {
                    await product.removeIngredient(id);
                }

                // Check if we want to add a new ingredient link
                if (prevIngredients[id] === undefined) {
                    let update = {};
                    if (updateIngredients[id].quantity === undefined) {
                        throw {code: 400, message: "Ingredient quantity is required"};
                    } else {
                        update.quantity = updateIngredients[id].quantity;
                    }
                    
                    if (updateIngredients[id].measurement === undefined) {
                        throw {code: 400, message: "Ingredient measurement is required"};
                    } else {
                        update.measurement = updateIngredients[id].measurement;
                    }

                    await product.addIngredient(id, {through: update});
                
                // Check if we want to update an existing ingredient link
                } else {
                    let ingredient = prevIngredients[id];
                    let update = {};
                    if (updateIngredients[id].quantity != undefined) {
                        update.quantity = updateIngredients[id].quantity;
                    }
                    if (updateIngredients[id].measurement != undefined) {
                        update.measurement = updateIngredients[id].measurement;
                    }

                    await ingredient.ingredientsToProducts.update(update);
                }
            }
        }

        // Update categories
        if (updatedProductDetails.categories != undefined) {
            // Structure
            // categories: {
            //   add: [1, 2, 3],
            //   remove: [4, 5, 6]
            // }
            const categories = await checkCategories(updatedProductDetails.categories);
            const product = await db.products.findByPk(updatedProductDetails.id);
            const currentCategories = await product.getCategories();

            // Loop through the current categories
            for (const category of currentCategories) {
                let id = category.id;
                
                // Remove the category if it's in the remove list
                // and in the current categories 
                if (categories.remove != undefined && categories.remove.includes(id)) {
                    await product.removeCategory(id);
                }

                // Add the category if it's in the add list
                // and not in the current categories
                if (categories.add != undefined && !categories.add.includes(id)) {
                    await product.addCategory(id);
                }
            }
        }

        res.status(200).json({
            status: "success",
            data: {
                message: "Product updated successfully"
            }
        });

    } catch (error) {
        return sendError(res, error, "Failed to update product");
    }
};

// DELETE: /delete/:id
async function deleteProduct(req, res) {
    try {
        const productId = req.params.id != undefined ? Number(req.params.id) : undefined;
        const productIdCheck = req.body.id;

        // Check if the product ID is valid
        if (productId != undefined || productIdCheck != undefined) {
            if (typeof productId !== "number" || typeof productIdCheck !== "number") {
                throw {code: 400, message: "Product ID must be a number"};
            }
            if (productId <= 0 && productIdCheck <= 0) {
                throw {code: 400, message: "Invalid product ID"};
            }
            if (productId != productIdCheck) {
                throw {code: 400, message: "Product ID mismatch"};
            }

            // Check if the product exists
            const foundProduct = await db.products.findOne({ where: { id: productId } });
            if (!foundProduct) {
                throw {code: 404, message: "Product not found"};
            }
        } else {
            throw {code: 400, message: "Product ID is required"};
        }

        // Delete the product
        await db.products.destroy({ where: { id: productId } });

        // Send response
        res.status(200).json({
            status: "success",
            message: "Product deleted successfully"
        });

    } catch (error) {
        return sendError(res, error, "Failed to delete product");
    }
};

export default {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}