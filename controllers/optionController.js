import db from "../models/index.js";
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkOptionId(id) {
    // Make sure the id is not undefined
    if (id === undefined) {
        throw { code: 400, message: "Option ID required" };
    }

    // Make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Option ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Option ID must be greater than 0" };
    }

    // Make sure the option exists
    const option = await db.options.findByPk(id);
    if (option === null) {
        throw { code: 404, message: "Option not found" };
    }

    // Return the option
    return option;
}

async function checkOptionDetails(details, optional=false) {
    // The details to return
    var optionDetails = {};

    // Check the price adjustment
    if (details.priceAdjustment !== undefined) {
        // Make sure the price adjustment is a number
        if (isNaN(details.priceAdjustment)) {
            throw { code: 400, message: "Price adjustment must be a number" };
        }
        // Make sure the price is not negative
        if (details.priceAdjustment < 0) {
            throw { code: 400, message: "Price adjustment must not be negative" };
        }
        optionDetails.priceAdjustment = details.priceAdjustment;
    } else if (!optional) {
        throw { code: 400, message: "Price adjustment required" };
    }

    // Check the default quantity
    if (details.defaultQuantity !== undefined) {
        // Make sure the default quantity is a number
        if (isNaN(details.defaultQuantity)) {
            throw { code: 400, message: "Default quantity must be a number" };
        }
        // Make sure the default quantity is not negative
        if (details.defaultQuantity < 0) {
            throw { code: 400, message: "Default quantity must not be negative" };
        }
        optionDetails.defaultQuantity = details.defaultQuantity;
    } else if (!optional) {
        throw { code: 400, message: "Default quantity required" };
    }

    // Check the min quantity
    if (details.minQuantity !== undefined) {
        // Make sure the min quantity is a number
        if (isNaN(details.minQuantity)) {
            throw { code: 400, message: "Min quantity must be a number" };
        }
        // Make sure the min quantity is not negative
        if (details.minQuantity < 0) {
            throw { code: 400, message: "Min quantity must not be negative" };
        }
        optionDetails.minQuantity = details.minQuantity;
    } else if (!optional) {
        throw { code: 400, message: "Min quantity required" };
    }

    // Check the max quantity
    if (details.maxQuantity !== undefined) {
        // Make sure the max quantity is a number
        if (isNaN(details.maxQuantity)) {
            throw { code: 400, message: "Max quantity must be a number" };
        }
        // Make sure the max quantity is not negative
        if (details.maxQuantity < 0) {
            throw { code: 400, message: "Max quantity must not be negative" };
        }
        optionDetails.maxQuantity = details.maxQuantity;
    } else if (!optional) {
        throw { code: 400, message: "Max quantity required" };
    }

    // Check the ingredient id
    if (details.ingredientId !== undefined) {
        // Make sure the ingredient id is a number
        if (isNaN(details.ingredientId)) {
            throw { code: 400, message: "Ingredient ID must be a number" };
        }
        // Make sure the ingredient id is not negative
        if (details.ingredientId <= 0) {
            throw { code: 400, message: "Ingredient ID must be greater than 0" };
        }
        // Make sure the ingredient exists
        const ingredient = await db.ingredients.findByPk(details.ingredientId);
        if (ingredient === null) {
            throw { code: 404, message: "Ingredient not found" };
        }
        optionDetails.ingredientId = details.ingredientId;
    } else if (!optional) {
        throw { code: 400, message: "Ingredient ID required" };
    }

    // Check if optional is true
    if (optional) {
        // Check if the details is empty
        if (Object.keys(optionDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return optionDetails;
}

////////////////////
//    Requests    //
////////////////////

// GET: /
async function getOptions(req, res) {
    /**
     * Body: null
     */
    try {
        // No checks needed
        /////////////////////
        //  Perform logic  //
        /////////////////////
        const options = await db.options.findAll();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: options
        });
    } catch (error) {
        return sendError(res, error, "Error getting options");
    }
}

// GET: /:id
async function getOptionById(req, res) {
    /**
     * Body: null
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const option = await checkOptionId(req.params.id);

        /////////////////////
        //  Perform logic  //
        /////////////////////


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: option
        });
    } catch (error) {
        return sendError(res, error, "Error getting option by ID");
    }
}

// POST: /create
async function createOption(req, res) {
    /**
     * Body: {
     *     priceAdjustment: number,
     *     defaultQuantity: number,
     *     minQuantity: number,
     *     maxQuantity: number,
     *     ingredientId: number,
     * }
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const optionDetails = await checkOptionDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        const option = await db.options.create(optionDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: option
        });
    } catch (error) {
        return sendError(res, error, "Error creating option");
    }
}

// PUT: /:id
async function updateOption(req, res) {
    /**
     * Body: {
     *     priceAdjustment: number,
     *     defaultQuantity: number,
     *     minQuantity: number,
     *     maxQuantity: number,
     *     ingredientId: number,
     * }
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const option = await checkOptionId(req.params.id);
        const optionDetails = await checkOptionDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await option.update(optionDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Option updated successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Error updating option");
    }
}

// DELETE: /:id
async function deleteOption(req, res) {
    /**
     * Body: null
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const option = await checkOptionId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await option.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Option deleted successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Error deleting option");
    }
}


export default {
    getOptions,
    getOptionById,
    createOption,
    updateOption,
    deleteOption
}







