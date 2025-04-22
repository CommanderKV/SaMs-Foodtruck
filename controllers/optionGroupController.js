import db from "../models/index.js";
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkOptionGroupId(id) {
    // Make sure the id is not undefined
    if (id === undefined) {
        throw { code: 400, message: "OptionGroup ID required" };
    }

    // Make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "OptionGroup ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "OptionGroup ID must be greater than 0" };
    }

    // Make sure the option exists
    const option = await db.optionGroups.findByPk(id);
    if (option === null) {
        throw { code: 404, message: "OptionGroup not found" };
    }

    // Return the option
    return option;
}

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

async function checkProductId(id) {
    // Make sure the id is not undefined
    if (id === undefined) {
        throw { code: 400, message: "Product ID required" };
    }

    // Make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Product ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Product ID must be greater than 0" };
    }

    // Make sure the product exists
    const product = await db.products.findByPk(id);
    if (product === null) {
        throw { code: 404, message: "Product not found" };
    }

    // Return the product
    return product;
}

async function checkOptionGroupDetails(details, optional=false) {
    // The details to return
    var optionDetails = {};

    // Check the section name
    if (details.sectionName !== undefined) {
        // Make sure the section name is a string
        if (typeof details.sectionName !== "string") {
            throw { code: 400, message: "Section name must be a string" };
        }
        // Make sure the section name is not empty
        if (details.sectionName === "") {
            throw { code: 400, message: "Section name must not be empty" };
        }
        optionDetails.sectionName = details.sectionName;
    } else if (!optional) {
        throw { code: 400, message: "Section name required" };
    }

    // Check the multiple choice flag
    if (details.multipleChoice !== undefined) {
        // Make sure the multiple choice flag is a boolean
        if (typeof details.multipleChoice !== "boolean") {
            throw { code: 400, message: "Multiple choice flag must be a boolean" };
        }
        optionDetails.multipleChoice = details.multipleChoice;
    } else if (!optional) {
        throw { code: 400, message: "Multiple choice flag required" };
    }

    // Check the required flag
    if (details.required !== undefined) {
        // Make sure the required flag is a boolean
        if (typeof details.required !== "boolean") {
            throw { code: 400, message: "Required flag must be a boolean" };
        }
        optionDetails.required = details.required;
    } else if (!optional) {
        throw { code: 400, message: "Required flag required" };
    }

    // Check if the product ID is provided
    if (details.productId !== undefined) {
        // Check if the product exists
        await checkProductId(details.productId);
        optionDetails.productId = details.productId;
    } else if (!optional) {
        throw { code: 400, message: "Product ID required" };
    }

    // Check if the optional flag is set
    if (optional) {
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
async function getOptionGroups(req, res) {
    /**
     * Body: null 
     */
    try {
        // No inputs to check
        /////////////////////
        //  Perform logic  //
        /////////////////////
        const optionGroups = await db.optionGroups.findAll();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: optionGroups
        });
    } catch (error) {
        return sendError(res, error, "Failed to get option groups");
    }
}

// GET: /:id
async function getOptionGroupById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run check on inputs  //
        ///////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);


        // No logic to perform
        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: optionGroup
        });
    } catch (error) {
        return sendError(res, error, "Failed to get option group by ID");
    }
}

// POST: /create
async function createOptionGroup(req, res) {
    /**
     * Body: {
     *     sectionName: string,
     *     multipleChoice: boolean,
     *     required: boolean,
     *     productId: number
     * }
     */
    try {
        ///////////////////////////
        //  Run check on inputs  //
        ///////////////////////////
        const optionGroupDetails = await checkOptionGroupDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        const optionGroup = await db.optionGroups.create(optionGroupDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: optionGroup
        });
    } catch (error) {
        return sendError(res, error, "Failed to create option group");
    }
}

// PUT: /update/:id
async function updateOptionGroup(req, res) {
    /**
     * Body: {
     *     sectionName: string,
     *     multipleChoice: boolean,
     *     required: boolean,
     * }
     */
    try {
        ///////////////////////////
        //  Run check on inputs  //
        ///////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);
        const optionDetails = await checkOptionGroupDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await optionGroup.update(optionDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "OptionGroup updated successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Failed to update option group");
    }
}

// DELETE: /delete/:id
async function deleteOptionGroup(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run check on inputs  //
        ///////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await optionGroup.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "OptionGroup deleted successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Failed to delete option groups");
    }
}



// GET: /:id/options
async function getOptionsInOptionGroup(req, res) {
    /**
     * Body: null
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        const options = await optionGroup.getOptions();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: options
        });
    } catch (error) {
        return sendError(res, error, "Failed to get options in option group");
    }
}

// POST: /:id/options
async function addOptionToOptionGroup(req, res) {
    /**
     * Body: {
     *     optionId: number
     * }
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);
        const option = await checkOptionId(req.body.optionId);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await optionGroup.addOption(option);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Option added to option group successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Failed to add option to option group");
    }
}

// DELETE: /:id/options/:optionId
async function removeOptionFromOptionGroup(req, res) {
    /**
     * Body: null
     */
    try {
        ////////////////////////////
        //  Run checks on inputs  //
        ////////////////////////////
        const optionGroup = await checkOptionGroupId(req.params.id);
        const option = await checkOptionId(req.params.optionId);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await optionGroup.removeOption(option);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Option removed from option group successfully"
            }
        });
    } catch (error) {
        return sendError(res, error, "Failed to remove option from option group");
    }
}


export default {
    getOptionGroups,
    getOptionGroupById,
    createOptionGroup,
    updateOptionGroup,
    deleteOptionGroup,

    getOptionsInOptionGroup,
    addOptionToOptionGroup,
    removeOptionFromOptionGroup,
};
