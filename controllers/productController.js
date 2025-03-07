import { Router } from 'express';
import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';
const router = Router();

// Handle creating errors
function sendError(res, error, message) {
    if (error instanceof TypeError) {
        return res.status(400).json({
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
            throw new TypeError("Invalid product ID");
        }

        // Get the product details
        const product = await db.products.findOne({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({
                status: "failure",
                message: "Product not found"
            });
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
            throw new TypeError("Name must be a string");
        }
        if (productDetails.name.trim() === "") {
            throw new TypeError("Name must not be empty");
        }
    } else {throw new TypeError("Name is required");}
    
    // Check if the description is set
    if (productDetails.description != undefined) {
        if (typeof productDetails.description !== "string") {
            throw new TypeError("Description must be a string");
        }
        if (productDetails.description.trim() === "") {
            throw new TypeError("Description must not be empty");
        }
    } else {throw new TypeError("Description is required");}

    // Check if the price is set
    if (productDetails.price != undefined) {
        if (typeof productDetails.price !== "number") {
            throw new TypeError("Price must be a decimal number");
        }
        if (productDetails.price <= 0) {
            throw new TypeError("Price must be greater than 0");
        }
    } else {
        throw new TypeError("Price is required");
    }

    // Check if the photo is set
    if (productDetails.photo != undefined) {
        if (typeof productDetails.photo !== "string") {
            throw new TypeError("Photo must be a string");
        }
        if (productDetails.photo.trim() === "") {
            throw new TypeError("Photo must not be empty");
        }
    }else {
        throw new TypeError("Photo is required");
    }
}

// Check all ingredient details
async function checkIngredientDetails(ingredients) {
    // Make sure ingredients are arrays
    if (!Array.isArray(ingredients)) {
        throw new TypeError("Ingredients must be an array");
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw new TypeError("Ingredient ID must be a number");
            }
            if (ingredient.id <= 0) {
                throw new TypeError("Invalid ingredient ID");
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw new TypeError("Invalid ingredient ID");
            }
        } else {throw new TypeError("Ingredient ID is required");}

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw new TypeError("Ingredient quantity must be a number");
            }
            if (ingredient.quantity <= 0) {
                throw new TypeError("Ingredient quantity must be greater than 0");
            }
        } else {throw new TypeError("Ingredient quantity is required");}

        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw new TypeError("Ingredient measurement must be a string");
            }
            if (ingredient.measurement.trim() === "") {
                throw new TypeError("Ingredient measurement must not be empty");
            }
        } else {throw new TypeError("Ingredient measurement is required");}
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
async function getUpdatedProduct(updatedProductDetails) {
    // Check to make sure a product id is given
    if (updatedProductDetails.id != undefined) {
        if (typeof updatedProductDetails.id !== "number") { throw new TypeError("Product ID must be a number"); }
        if (updatedProductDetails.id <= 0) { throw new TypeError("Invalid product ID"); }
    } else { throw new TypeError("Product ID is required"); }

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
        throw new TypeError("Ingredients must be an array");
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw new TypeError("Ingredient ID must be a number");
            }
            if (ingredient.id <= 0) {
                throw new TypeError("Invalid ingredient ID");
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw new TypeError("Invalid ingredient ID");
            }
        } else {throw new TypeError("Ingredient ID is required");}

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw new TypeError("Ingredient quantity must be a number");
            }
            if (ingredient.quantity <= 0) {
                throw new TypeError("Ingredient quantity must be greater than 0");
            }
        }
        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw new TypeError("Ingredient measurement must be a string");
            }
            if (ingredient.measurement.trim() === "") {
                throw new TypeError("Ingredient measurement must not be empty");
            }
        }
        
        if (ingredient.quantity === undefined && ingredient.measurement === undefined){
            throw new TypeError("Ingredient needs quantity or measurement");
        }
    }
}

// PUT: /update
async function updateProduct (req, res) {
    try {
        const updatedProductDetails = req.body;
        
        /////////////////////////////
        //  Check body parameters  //
        /////////////////////////////
        // Get the updated product
        const updatedProduct = await getUpdatedProduct(updatedProductDetails);
        
        // Check if the product exists
        const foundProduct = await db.products.findOne({ where: { id: updatedProductDetails.id } });
        if (!foundProduct) {
            return res.status(404).json({
                status: "failure",
                message: "Product not found"
            })
        }

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
            const ingredients = updatedProductDetails.ingredients;
            const oldIngredients = Object.fromEntries(ingredients.map((x) => [x.id, x]));

            // Get all ingredient links
            const product = await db.products.findOne({ 
                where: { 
                    id: updatedProductDetails.id 
                },
                include: db.ingredients
            });
            
            // Update the ingredients
            const foundIngredients = product.ingredients;
            for (const ingredient of foundIngredients) {
                let id = ingredient.id
                let oldIngredient = oldIngredients[id]
                
                // Check for values to update
                if (oldIngredient.quantity != undefined) {
                    ingredient.quantity = oldIngredient.quantity;
                }
                
                if (oldIngredient.measurement != undefined) {
                    ingredient.measurement = oldIngredient.measurement;
                }

                ingredient.update();
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

// DELETE: /delete
async function deleteProduct(req, res) {
    try {
        const productId = req.body.id;

        // Check if the product ID is valid
        if (productId != undefined) {
            if (typeof productId !== "number") {
                throw new TypeError("Product ID must be a number");
            }
            if (productId <= 0) {
                throw new TypeError("Invalid product ID");
            }

            // Check if the product exists
            const foundProduct = await db.products.findOne({ where: { id: productId } });
            if (!foundProduct) {
                throw new TypeError("Invalid product ID");
            }
        } else {
            throw new TypeError("Product ID is required");
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