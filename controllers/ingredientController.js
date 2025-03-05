import { Router } from 'express';
import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';

const router = Router();

// GET: /
router.get("/", async (req, res) => {
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
        console.error("Error fetching ingredients:", error);
        res.status(500).json({
            status: "failure",
            message: "Failed to fetch ingredients"
        });
    }
});

// GET: /:id
router.get("/:id", async (req, res) => {
    try {
        // Get the ingredient ID
        const id = req.params.id;
        
        if (id !== undefined) {
            if (isNaN(id)) {
                throw new ValueError("Invalid ingredient ID");
            }
            if (id < 0) {
                throw new ValueError("Invalid ingredient ID");
            }
        } else {throw new ValueError("Ingredient ID Required");}

        const ingredient = await db.ingredients.findByPk(id);

        // Return the ingredient
        res.status(200).json({
            status: "success",
            data: ingredient
        });

    // Catch any database errors
    } catch (error) {
        if (typeof error == "ValueError") {
            res.status(400).json({
                status: "failure",
                message: error.message
            });
        } else {
            console.error("Error fetching ingredient:", error);
            res.status(500).json({
                status: "failure",
                message: "Failed to fetch ingredient"
            });
        }
    }
});

// POST: /create
router.post("/create", async (req, res) => {
    try {
        // Get the ingredient data
        let { name, description, quantity, photo, productLnk, price } = req.body;

        // Check the ingredient data
        if (name === undefined || typeof name !== "string") {
            throw new ValueError("Ingredient name required");
        }
        if (description === undefined || typeof description !== "string") {
            throw new ValueError("Invalid ingredient description");
        }
        if (quantity === undefined || (typeof quantity !== "number" || quantity < 0)) {
            throw new ValueError("Invalid ingredient quantity");
        }
        if (photo === undefined || typeof photo !== "string") {
            throw new ValueError("Invalid ingredient photo");
        } else {
            photo = await savePhoto(photo);
        }
        if (productLnk === undefined || typeof productLnk !== "string") {
            throw new ValueError("Invalid ingredient product link");
        }
        if (price === undefined || (typeof price !== "number" || price < 0)) {
            throw new ValueError("Invalid ingredient price");
        }

        // Create the ingredient
        const ingredient = await db.ingredients.create({
            name: name,
            description: description,
            quantity: quantity,
            photo: photo,
            productLnk: productLnk,
            price: price
        });

        // Return the ingredient
        res.status(201).json({
            status: "success",
            data: null
        });
    } catch (error) {
        if (typeof error == "ValueError") {
            res.status(400).json({
                status: "failure",
                message: error.message
            });
        } else {
            console.error("Error creating ingredient:", error);
            res.status(500).json({
                status: "failure",
                message: "Failed to create ingredient"
            });
        }
    }
});

// PUT: /update
router.put("/update", async (req, res) => {
    try {
        // Get possible fields to update
        let { id, name, description, quantity, photo, productLnk, price } = req.body;

        // Check the ingredient data
        if (id === undefined || isNaN(id) || id < 0) {
            throw new ValueError("Invalid ingredient ID");
        }

        // Get the ingredient
        const ingredient = await db.ingredients.findOne({ where: { id: id } });

        // Check if the ingredient exists
        if (!ingredient) {
            throw new ValueError("Ingredient not found");
        }

        // Update the ingredient
        let updatedIngredient = {};
        if (name !== undefined && typeof name === "string") {
            updatedIngredient.name = name;
        }
        if (description !== undefined && typeof description === "string") {
            updatedIngredient.description = description;
        }
        if (quantity !== undefined && (typeof quantity === "number" && quantity >= 0)) {
            updatedIngredient.quantity = quantity;
        }
        if (photo !== undefined && typeof photo === "string") {
            updatedIngredient.photo = await savePhoto(photo);
        }
        if (productLnk !== undefined && typeof productLnk === "string") {
            updatedIngredient.productLnk = productLnk;
        }
        if (price !== undefined && (typeof price === "number" && price >= 0)) {
            updatedIngredient.price = price;
        }

        // Save the ingredient
        await db.ingredients.update(
            updatedIngredient,
            {
                where: {
                    id: id
                }
            }
        );

        // Return that we updated the ingredient
        res.status(200).json({
            status: "success",
            data: null
        });

    } catch (error) {
        if (typeof error == "ValueError") {
            res.status(400).json({
                status: "failure",
                message: error.message
            });
        } else {
            console.error("Error updating ingredient:", error);
            res.status(500).json({
                status: "failure",
                message: "Failed to update ingredient"
            });
        }
    }
});

// DELETE: /delete
router.delete("/delete", async (req, res) => {
    try {
        // Get the ingredient ID
        const id = req.body.id;

        // Check the ingredient ID
        if (id === undefined || isNaN(id) || id < 0) {
            throw new ValueError("Invalid ingredient ID");
        }

        // Get the ingredient
        const ingredient = await db.ingredients.findByPk(id);

        // Check if the ingredient exists
        if (ingredient === null) {
            throw new ValueError("Ingredient not found");
        }

        // Delete the ingredient
        await ingredient.destroy();

        // Return the ingredient
        res.status(200).json({
            status: "success",
            data: null
        });
    } catch (error) {
        if (typeof error == "ValueError") {
            res.status(400).json({
                status: "failure",
                message: error.message
            });
        } else {
            console.error("Error deleting ingredient:", error);
            res.status(500).json({
                status: "failure",
                message: "Failed to delete ingredient"
            });
        }
    }
});

export default router;