import db from '../models/index.js';
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkCustomizationId(id) {
    // Check to make sure the id is not null
    if (id === undefined) {
        throw { code: 400, message: "Customization ID required" };
    }

    // Check to make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Customization ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Customization ID must be greater than 0" };
    }

    // Check to make sure the customization exists
    const customization = await db.customizations.findByPk(id);
    if (customization === null) {
        throw { code: 404, message: "Customization not found" };
    }

    return customization;
}

async function checkCustomizationDetails(details, optional=false) {
    const customizationDetails = {};

    // Check quantity
    if (details.quantity !== undefined) {
        if (isNaN(details.quantity)) {
            throw { code: 400, message: "Quantity must be a number" };
        } else if (details.quantity <= 0) {
            throw { code: 400, message: "Quantity must be greater than 0" };
        }

        customizationDetails.quantity = details.quantity;
    } else if (!optional) {
        throw { code: 400, message: "Quantity is required" };
    }

    // Check price
    if (details.price !== undefined) {
        if (isNaN(details.price)) {
            throw { code: 400, message: "Price must be a number" };
        } else if (details.price <= 0) {
            throw { code: 400, message: "Price must be greater than 0" };
        }

        customizationDetails.price = details.price;
    } else if (!optional) {
        throw { code: 400, message: "Price is required" };
    }

    // Check ingredientId
    if (details.ingredientId !== undefined) {
        if (isNaN(details.ingredientId)) {
            throw { code: 400, message: "Ingredient ID must be a number" };
        } else if (details.ingredientId <= 0) {
            throw { code: 400, message: "Ingredient ID must be greater than 0" };
        }

        // Check to make sure the ingredient exists
        const ingredient = await db.ingredients.findByPk(details.ingredientId);
        if (!ingredient) {
            throw { code: 404, message: "Ingredient not found" };
        }
        
        customizationDetails.ingredientId = details.ingredientId;
    } else if (!optional) {
        throw { code: 400, message: "Ingredient ID is required" };
    }

    // Check if there are any details to update
    if (optional) {
        if (Object.keys(customizationDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    return customizationDetails;
}

////////////////////
//    Requests    //
////////////////////

// GET: /:id
async function getCustomizationById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const customization = await checkCustomizationId(req.params.id);


        // No logic to perform
        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success", 
            data: customization
        });
    } catch (error) {
        sendError(res, error, "Failed to fetch customization");
    }
}

// POST: /create
async function createCustomization(req, res) {
    /**
     * Body: {
     *    quantity: int,
     *    price: float,
     *    ingredientId: int
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const customizationDetails = await checkCustomizationDetails(req.body);


        ///////////////////// 
        //  Perform logic  //
        /////////////////////
        const customization = await db.customizations.create(customizationDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success", 
            data: customization
        });
    } catch (error) {
        sendError(res, error, "Failed to create customization");
    }
}

// PUT: /update/:id
async function updateCustomization(req, res) {
    /**
     * Body: {
     *    quantity: int,
     *    price: float,
     *    ingredientId: int
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const customization = await checkCustomizationId(req.params.id);
        const customizationDetails = await checkCustomizationDetails(req.body, true);


        ///////////////////// 
        //  Perform logic  //
        /////////////////////
        await customization.update(customizationDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Customization updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update customization");
    }
}

// DELETE: /delete/:id
async function deleteCustomization(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const customization = await checkCustomizationId(req.params.id);


        ///////////////////// 
        //  Perform logic  //
        /////////////////////
        await customization.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Customization deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete customization");
    }
}

export default {
    getCustomizationById,
    createCustomization,
    updateCustomization,
    deleteCustomization,
};
