import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

// Handle creating errors
function sendError(res, error, message) {
    if (error instanceof Error == false) {
        return res.status(error.code).json({
            status: error.status ? error.status : "failure",
            message: error.message
        });
    } else {
        console.log(`${message} --ERROR-- ${error} -- STACK -- ${error.stack}`);
        return res.status(500).json({
            status: "failure",
            message: message
        });
    }
}

async function checkIngredientId(id) {
    // Check to make sure the id is not null
    if (id === undefined) {
        throw { code: 400, message: "Ingredient ID required" };
    }

    // Check to make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Ingredient ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Ingredient ID must be greater than 0" };
    }

    // Check to make sure the ingredient exists
    const ingredient = await db.ingredients.findByPk(id);
    if (ingredient === null) {
        throw { code: 404, message: "Ingredient not found" };
    }

    return ingredient;
}

function checkIngredientDetails(details, optional=false) {
    // The details to return
    var ingredientDetails = {};

    // Check the name
    if (details.name !== undefined) {
        // Make sure the name is a string
        if (typeof details.name !== "string") {
            throw { code: 400, message: "Name must be a string" };
        }
        // Check if the name is empty
        if (details.name === "") {
            throw { code: 400, message: "Name required" };
        }
        ingredientDetails.name = details.name;
    } else if (!optional) {
        throw { code: 400, message: "Name required" };
    }

    // Check the description
    if (details.description !== undefined) {
        // Make sure the description is a string
        if (typeof details.description !== "string") {
            throw { code: 400, message: "Description must be a string" };
        }
        // Check if the description is empty
        if (details.description === "") {
            throw { code: 400, message: "Description required" };
        }
        ingredientDetails.description = details.description;
    } else if (!optional) {
        throw { code: 400, message: "Description required" };
    }

    // Check the quantity
    if (details.quantity !== undefined) {
        // Make sure the quantity is a number
        if (typeof details.quantity !== "number") {
            throw { code: 400, message: "Quantity must be a number" };
        }
        // Check if the quantity is less than 0
        if (details.quantity < 0) {
            throw { code: 400, message: "Quantity cannot be negative" };
        }
        ingredientDetails.quantity = details.quantity;
    } else if (!optional) {
        throw { code: 400, message: "Quantity required" };
    }

    // Check the photo
    if (details.photo !== undefined) {
        // Make sure the photo is a string
        if (typeof details.photo !== "string") {
            throw { code: 400, message: "Photo must be a string" };
        }
        // Check if the photo is empty
        if (details.photo === "") {
            throw { code: 400, message: "Photo required" };
        }
        ingredientDetails.photo = details.photo;
    } else if (!optional) {
        throw { code: 400, message: "Photo required" };
    }

    // Check the product link
    if (details.productLink !== undefined) {
        // Make sure the product link is a string
        if (typeof details.productLink !== "string") {
            throw { code: 400, message: "Product link must be a string" };
        }
        // Check if the product link is empty
        if (details.productLink === "") {
            throw { code: 400, message: "Product link required" };
        }
        ingredientDetails.productLink = details.productLink
    } else if (!optional) {
        throw { code: 400, message: "Product link required" };
    }

    // Check the price
    if (details.price !== undefined) {
        // Make sure the price is a number
        if (typeof details.price !== "number") {
            throw { code: 400, message: "Price must be a number" };
        }
        // Check if the price is less than 0
        if (details.price < 0) {
            throw { code: 400, message: "Price cannot be negative" };
        }
        ingredientDetails.price = details.price;
    } else if (!optional) {
        throw { code: 400, message: "Price required" };
    }

    // Check to make sure details are not empty
    // if they are optional
    if (optional) {
        if (Object.keys(ingredientDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return ingredientDetails;
}


////////////////////
//    Requests    //
////////////////////

// GET: /
async function getIngredients(req, res) {
    /**
     * Body: null
     */
    try {
        // No inputs to check
        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get all ingredients
        const ingredients = await db.ingredients.findAll();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: ingredients
        });
    } catch (error) {
        return sendError(res, error, "Failed to fetch ingredients");
    }
}

// GET: /:id
async function getIngredientById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const ingredient = await checkIngredientId(req.params.id);


        // No logic to perform
        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: ingredient
        });
    } catch (error) {
        return sendError(res, error, "Failed to fetch ingredient");
    }
}

// POST: /create
async function createIngredient(req, res) {
    /**
     * Body: {
     *     name: string,
     *     description: string,
     *     quantity: number,
     *     photo: string,
     *     productLink: string,
     *     price: number
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const ingredientDetails = checkIngredientDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Save the photo
        ingredientDetails.photo = await savePhoto(ingredientDetails.photo);

        // Create the ingredient
        const ingredient = await db.ingredients.create(ingredientDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: ingredient
        });
    } catch (error) {
        sendError(res, error, "Failed to create ingredient");
    }
}

// PUT: /update/:id
async function updateIngredient(req, res) {
    /**
     * Body: {
     *     name: string,
     *     description: string,
     *     quantity: number,
     *     photo: string,
     *     productLink: string,
     *     price: number
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const ingredient = await checkIngredientId(req.params.id);
        const ingredientDetails = checkIngredientDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if photo needs to be updated
        if (ingredientDetails.photo) {
            // Save the photo
            ingredientDetails.photo = await savePhoto(ingredientDetails.photo);
        }

        // Update the ingredient
        await ingredient.update(ingredientDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Ingredient updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update ingredient");
    }
}

// DELETE: /delete/:id
async function deleteIngredient(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const ingredient = await checkIngredientId(req.params.id);

        ////////////////////
        //  Perform logic //
        ////////////////////
        await ingredient.destroy();

        //////////////////////
        //  Send a response //
        //////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Ingredient deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete ingredient");
    }
}

export default {
    getIngredients,
    getIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient
};