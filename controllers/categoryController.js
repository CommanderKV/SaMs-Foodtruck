import db from '../models/index.js';

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
async function getCategories(req, res) {
    try {
        // Get all categories
        const categories = await db.categories.findAll();

        // Return the categories
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
    try {
        // Get the category ID
        const id = req.params.id;
        
        // Check the ID
        if (id !== undefined) {
            if (isNaN(id)) {
                throw { code: 400, message: "Invalid category ID" };
            }
            if (id < 0) {
                throw { code: 400, message: "Invalid category ID" };
            }
        } else {
            throw { code: 400, message: "Category ID Required" };
        }

        // Ge the category
        const category = await db.categories.findByPk(id);
        if (category === null) {
            throw { code: 404, message: "Category not found" };
        }

        // Return the category
        res.status(200).json({
            status: "success",
            data: category
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch category");
    }
}

// Check to make sure all required fields are present
function checkCategoryParams(category) {
    if (category.name === undefined || typeof category.name !== "string") {
        throw { code: 400, message: "Name required" };
    }

    if (category.description !== undefined && typeof category.description !== "string") {
        throw { code: 400, message: "Description must be a string" };
    }
}

// POST: /create
async function createCategory(req, res) {
    try {
        // Get the category data
        const categoryParams = req.body;

        // Check the category data
        checkCategoryParams(categoryParams);

        // Create the category
        const category = await db.categories.create({
            name: categoryParams.name,
            description: categoryParams.description
        });

        // Return the category
        res.status(201).json({
            status: "success",
            data: category
        });
    } catch (error) {
        sendError(res, error, "Failed to create category");
    }
}

function checkUpdateCategoryDetails(categoryDetails) {
    if (categoryDetails.name !== undefined) {
        if (typeof categoryDetails.name !== "string") {
            throw { code: 400, message: "Name must be a string" };
        }
    }

    if (categoryDetails.description !== undefined) {
        if (typeof categoryDetails.description !== "string") {
            throw { code: 400, message: "Description must be a string" };
        }
    }
}

// PUT: /update/:id
async function updateCategory(req, res) {
    try {
        // Get possible fields to update
        const categoryDetails = req.body;
        const id = req.params.id != undefined ? Number(req.params.id) : req.params.id;

        // Check the values
        checkUpdateCategoryDetails(categoryDetails);

        if (id !== undefined && categoryDetails.id !== undefined) {
            if (isNaN(id) || id < 0 || isNaN(categoryDetails.id) || categoryDetails.id < 0) {
                throw { code: 400, message: "Invalid category ID" };
            }
            if (id !== categoryDetails.id) {
                throw { code: 400, message: "Category ID mismatch" };
            }
        } else {
            throw { code: 400, message: "Category ID required" };
        }

        let category = await db.categories.findByPk(id);
        if (!category) {
            throw { code: 404, message: "Category not found" };
        }

        // Update the category
        let updatedCategory = {};
        for (const key in categoryDetails) {
            if (categoryDetails[key] != undefined && key != "id") {
                updatedCategory[key] = categoryDetails[key];
            }
        }

        // Update the category
        if (Object.keys(updatedCategory).length !== 0) {
            await db.categories.update(
                updatedCategory,
                { 
                    where: { 
                        id: id 
                    } 
                }
            )
        }

        // Return that we updated the category
        res.status(200).json({
            status: "success",
            data: "Category updated"
        });

    } catch (error) {
        sendError(res, error, "Failed to update category");
    }
}

// DELETE: /delete
async function deleteCategory(req, res) {
    try {
        // Get the category ID
        const id = req.body.id;
        const id2 = req.params.id != undefined ? Number(req.params.id) : req.params.id;

        // Check the category ID
        if (id !== undefined && id2 !== undefined) {
            if (isNaN(id) || isNaN(id2)) {
                throw { code: 400, message: "Invalid category ID" };
            }
            if (id < 0 || id2 < 0) {
                throw { code: 400, message: "Invalid category ID" };
            }
            if (id !== id2) {
                throw { code: 400, message: "Category ID mismatch" };
            }
        } else {
            throw { code: 400, message: "Category ID required" };
        }

        // Get the category
        const category = await db.categories.findByPk(id);

        // Check if the category exists
        if (category === null) {
            throw { code: 404, message: "Category not found" };
        }

        // Delete the category
        await category.destroy();

        // Return the category
        res.status(200).json({
            status: "success",
            data: "Category deleted"
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
