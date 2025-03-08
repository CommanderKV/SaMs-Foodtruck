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
        const menuItems = await db.products.findAll();

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
        }

        // Update ingredients
        if (updatedProductDetails.ingredients != undefined) {
            // Create a map for old ingredients
            const ingredientLinks = updatedProductDetails.ingredients;
            const oldIngredientLinks = ingredientLinks.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});

            for (const id in oldIngredientLinks) {
                // Get the ingredient link
                let link = await db.ingredientsToProducts.findOne({
                    where: {
                        productId: updatedProductDetails.id,
                        ingredientId: id
                    }
                });
                let oldIngredientLink = oldIngredientLinks[id];
                
                // Check for values to update
                if (oldIngredientLink.quantity != undefined) {
                    link.quantity = oldIngredientLink.quantity;
                    link.changed("quantity", true);
                }
                if (oldIngredientLink.measurement != undefined) {
                    link.measurement = oldIngredientLink.measurement;
                    link.changed("measurement", true);
                }
                
                await link.save();
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