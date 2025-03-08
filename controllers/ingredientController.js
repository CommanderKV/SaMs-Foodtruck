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
async function getIngredients(req, res) {
    try {
        // Get all ingredients
        const ingredients = await db.ingredients.findAll();

        // Return the ingredients
        res.status(200).json({
            status: "success",
            data: ingredients
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch ingredients");
    }
}

// GET: /:id
async function getIngredientById(req, res) {
    try {
        // Get the ingredient ID
        const id = req.params.id;
        
        if (id !== undefined) {
            if (isNaN(id)) {
                throw { code: 400, message: "Invalid ingredient ID" };
            }
            if (id < 0) {
                throw { code: 400, message: "Invalid ingredient ID" };
            }
        } else {
            throw { code: 400, message: "Ingredient ID Required" };
        }

        const ingredient = await db.ingredients.findByPk(id);
        if (ingredient === null) {
            throw { code: 404, message: "Ingredient not found" };
        }

        // Return the ingredient
        res.status(200).json({
            status: "success",
            data: ingredient
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch ingredient");
    }
}

// Check to make sure all required fields are present
function checkIngredientParams(ingredient) {
    if (ingredient.name === undefined || typeof ingredient.name !== "string") {
        throw { code: 400, message: "Name required" };
    }

    if (ingredient.description === undefined || typeof ingredient.description !== "string") {
        throw { code: 400, message: "Description required" };
    }
    
    if (ingredient.quantity !== undefined) {
        if (typeof ingredient.quantity !== "number") {
            throw { code: 400, message: "Quantity required" };
        } else if (ingredient.quantity < 0) {
            throw { code: 400, message: "Quantity must be greater than 0" };
        }
    } else {
        throw { code: 400, message: "Quantity required" };
    }

    if (ingredient.photo === undefined || typeof ingredient.photo !== "string") {
        throw { code: 400, message: "Photo required" };
    }

    if (ingredient.productLink === undefined || typeof ingredient.productLink !== "string") {
        throw { code: 400, message: "Product link required" };
    }
    
    if (ingredient.price !== undefined) {
        if (typeof ingredient.price !== "number") {
            throw { code: 400, message: "Price required" };
        } else if (ingredient.price < 0) {
            throw { code: 400, message: "Price must be greater than 0" };
        }
    } else {
        throw { code: 400, message: "Price required" };
    }
}

// POST: /create
async function createIngredient(req, res) {
    try {
        // Get the ingredient data
        const ingredientParams = req.body;

        // Check the ingredient data
        checkIngredientParams(ingredientParams);

        // Create the ingredient
        const ingredient = await db.ingredients.create({
            name: ingredientParams.name,
            description: ingredientParams.description,
            quantity: ingredientParams.quantity,
            photo: await savePhoto(ingredientParams.photo),
            productLink: ingredientParams.productLink,
            price: ingredientParams.price
        });

        // Return the ingredient
        res.status(201).json({
            status: "success",
            data: ingredient
        });
    } catch (error) {
        sendError(res, error, "Failed to create ingredient");
    }
}

function checkUpdateIngredientDetails(ingredientDetails) {
    if (ingredientDetails.name !== undefined) {
        if (typeof ingredientDetails.name !== "string") {
            throw { code: 400, message: "Name must be a string" };
        }
    }

    if (ingredientDetails.description !== undefined) {
        if (typeof ingredientDetails.description !== "string") {
            throw { code: 400, message: "Description required" };
        }
    }
    
    if (ingredientDetails.quantity !== undefined) {
        if (typeof ingredientDetails.quantity !== "number") {
            throw { code: 400, message: "Quantity required" };
        } else if (ingredientDetails.quantity < 0) {
            throw { code: 400, message: "Quantity must be greater than 0" };
        }
    }

    if (ingredientDetails.photo !== undefined) {
        if (typeof ingredientDetails.photo !== "string") {
            throw { code: 400, message: "Photo required" };
        }
    }

    if (ingredientDetails.productLink !== undefined) {
        if (typeof ingredientDetails.productLink !== "string") {
            throw { code: 400, message: "Product link required" };
        }
    }
    
    if (ingredientDetails.price !== undefined) {
        if (typeof ingredientDetails.price !== "number") {
            throw { code: 400, message: "Price required" };
        } else if (ingredientDetails.price < 0) {
            throw { code: 400, message: "Price must be greater than 0" };
        }
    }
}

// PUT: /update/:id
async function updateIngredient(req, res) {
    try {
        // Get possible fields to update
        const ingredientDetails = req.body;
        const id = req.params.id != undefined ? Number(req.params.id) : req.params.id;

        // Check the values
        checkUpdateIngredientDetails(ingredientDetails);

        if (id !== undefined && ingredientDetails.id !== undefined) {
            if (isNaN(id) || id < 0 || isNaN(ingredientDetails.id) || ingredientDetails.id < 0) {
                throw { code: 400, message: "Invalid ingredient ID" };
            }
            if (id !== ingredientDetails.id) {
                throw { code: 400, message: "Ingredient ID mismatch" };
            }
        } else {
            throw { code: 400, message: "Ingredient ID required" };
        }

        let ingredient = await db.ingredients.findByPk(id);
        if (!ingredient) {
            throw { code: 404, message: "Ingredient not found" };
        }

        // Update the ingredient
        let updatedIngredient = {};
        for (const key in ingredientDetails) {
            if (ingredientDetails[key] != undefined && (key != "id" || key != "photo")) {
                updatedIngredient[key] = ingredientDetails[key];
            }
        }
        
        if (ingredientDetails.photo !== undefined) {
            updatedIngredient.photo = await savePhoto(ingredientDetails.photo);
        } else {
            updatedIngredient.photo = ingredient.photo;
        }

        // Update the ingredient
        if (Object.keys(updatedIngredient).length !== 0) {
            await db.ingredients.update(
                updatedIngredient,
                { 
                    where: { 
                        id: id 
                    } 
                }
            )
        }

        // Return that we updated the ingredient
        res.status(200).json({
            status: "success",
            data: "Ingredient updated"
        });

    } catch (error) {
        sendError(res, error, "Failed to update ingredient");
    }
}

// DELETE: /delete
async function deleteIngredient(req, res) {
    try {
        // Get the ingredient ID
        const id = req.body.id;
        const id2 = req.params.id != undefined ? Number(req.params.id) : req.params.id;

        // Check the ingredient ID
        if (id !== undefined && id2 !== undefined) {
            if (isNaN(id) || isNaN(id2)) {
                throw { code: 400, message: "Invalid ingredient ID" };
            }
            if (id < 0 || id2 < 0) {
                throw { code: 400, message: "Invalid ingredient ID" };
            }
            if (id !== id2) {
                throw { code: 400, message: "Ingredient ID mismatch" };
            }
        } else {
            throw { code: 400, message: "Ingredient ID required" };
        }

        // Get the ingredient
        const ingredient = await db.ingredients.findByPk(id);

        // Check if the ingredient exists
        if (ingredient === null) {
            throw { code: 404, message: "Ingredient not found" };
        }

        // Delete the ingredient
        await ingredient.destroy();

        // Return the ingredient
        res.status(200).json({
            status: "success",
            data: "Ingredient deleted"
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