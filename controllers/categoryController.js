import db from '../models/index.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

// Handle creating errors
function sendError(res, error, message) {
    if (error instanceof Error == false) {
        return res.status(error.code).json({
            status: "failure",
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

async function checkCategoryId(id) {
    // Check to make sure the id is not null
    if (id === undefined) {
        throw { code: 400, message: "Category ID required" };
    }

    // Check to make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Category ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Category ID must be greater than 0" };
    }

    // Check to make sure the category exists
    const category = await db.categories.findByPk(id);
    if (category === null) {
        throw { code: 404, message: "Category not found" };
    }

    return category;
}

function checkCategoryDetails(details, optional=false) {
    // The details to return
    var categoryDetails = {};

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
        categoryDetails.name = details.name;
    } else if (!optional) {
        throw { code: 400, message: "Name required" };
    }

    // Check the description
    if (details.description !== undefined) {
        // Make sure the description is a string
        if (typeof details.description !== "string") {
            throw { code: 400, message: "Description must be a string" };
        }

        if (details.description === "") {
            throw { code: 400, message: "Description empty" };
        }

        categoryDetails.description = details.description;
    }

    // Check if the details are optional
    if (optional) {
        if (Object.keys(categoryDetails).length === 0) {
            throw { code: 400, message: "No details to update" };
        }
    }

    // Return the details
    return categoryDetails;
}

////////////////////
//    Requests    //
////////////////////

// GET: /
async function getCategories(req, res) {
    /**
     * Body: null
     */
    try {
        // No input to check 
        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get all categories
        const categories = await db.categories.findAll();


        //////////////////////
        //  Send a response //
        //////////////////////
        res.status(200).json({
            status: "success",
            data: categories
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch categories");
    }
}

// GET: /:id
async function getCategoryById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const category = await checkCategoryId(req.params.id);


        // No logic to perform
        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: category
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch category");
    }
}

// POST: /create
async function createCategory(req, res) {
    /**
     * Body: {
     *    name: string,
     *    description: string
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const categoryDetails = checkCategoryDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Create the category
        const category = await db.categories.create(categoryDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: category
        });
    } catch (error) {
        sendError(res, error, "Failed to create category");
    }
}

// PUT: /update/:id
async function updateCategory(req, res) {
    /**
     * Body: {
     *     name: string,
     *     description: string
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const category = await checkCategoryId(req.params.id);
        const categoryDetails = checkCategoryDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await category.update(categoryDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Category updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update category");
    }
}

// DELETE: /delete/:id
async function deleteCategory(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const category = await checkCategoryId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Delete the category
        await category.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Category deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete category");
    }
}

export default {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
