import { Router } from 'express';
import db from '../../models/index.js';
import savePhoto from '../../tools/photoSaver.js';
const router = Router();

// GET: /
router.get("/", async (req, res) => {
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
});

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
}

// Check all ingredient details
async function checkIngredientDetails(ingredients) {
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
router.post("/create", async (req, res) => {
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
            data: null
        });

    // Catch any errors
    } catch (error) {
        // If we threw the error then send failure message
        if (error instanceof TypeError) {
            return res.status(400).json({
                status: "failure",
                message: error.message
            });

        // If the error was thrown by something else
        } else {
            console.log(`Failed to add menu item ${error}`);
            res.status(500).json({
                status: "failure",
                message: "Failed to add menu item"
            });
        }
    }
});



export default router;