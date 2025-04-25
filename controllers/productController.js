import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';
import sendError from '../tools/errorHandling.js';
import removeNulls from '../tools/dataCleaning.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

function cleanProduct(products) {
    // Make sure products is an array
    if (!Array.isArray(products)) {
        products = [products];
    }

    // Remove any null values from the products
    products = removeNulls(products);

    //////////////////////////////////
    // Make sure the response is in //
    // the correct format for each  //
    //           element            //
    //////////////////////////////////
    products.forEach(element => {
        // Make sure that the ingredients are in a list
        if (element.ingredients && !Array.isArray(element.ingredients)) {
            element.ingredients = [element.ingredients];
        }

        // Make sure the categories are in a list
        if (element.categories && !Array.isArray(element.categories)) {
            element.categories = [element.categories];
        }

        // Make sure the optionGroups are in a list
        if (element.optionGroups && !Array.isArray(element.optionGroups)) {
            element.optionGroups = [element.optionGroups];
            element.optionGroups.forEach(optionGroup => {
                if (optionGroup.options && !Array.isArray(optionGroup.options)) {
                    optionGroup.options = [optionGroup.options];
                }
            });
        }

        //////////////////////////////////
        // Preform clean up of response //
        //////////////////////////////////
        if (element.ingredients) {
            element.ingredients.forEach(ingredient => {
                if (ingredient.ingredientsToProducts) {
                    ingredient.quantity = ingredient.ingredientsToProducts.quantity;
                    ingredient.measurement = ingredient.ingredientsToProducts.measurement;
                    delete ingredient.ingredientsToProducts;
                }
            });
        }

        if (element.categories) {
            element.categories.forEach(category => {
                if (category.categoriesToProducts) {
                    delete category.categoriesToProducts;
                }
            });
        }

        if (element.optionGroups) {
            element.optionGroups.forEach(optionGroup => {
                if (optionGroup.options) {
                    optionGroup.options.forEach(option => {
                        if (option.optionsToGroups) {
                            delete option.optionsToGroups;
                        }
                    });
                }
            });
        }
    });

    // Return the cleaned products
    return products;
}

async function checkProductId(productId) {
    // Check if the product ID is undefined
    if (productId === undefined) {
        throw {code: 400, message: "Product ID is required"};
    }

    // Check if the product ID is valid
    if (isNaN(productId)) {
        throw {code: 400, message: "Product ID must be a number"};
    } else if (productId <= 0) {
        throw {code: 400, message: "Invalid product ID"};
    }

    // Check if the product exists
    const foundProduct = await db.products.findByPk(productId);
    if (!foundProduct) {
        throw {code: 404, message: "Product not found"};
    }
    
    // Return the product
    return foundProduct;
}

async function checkCategoryId(categoryId) {
    // Check if the category ID is undefined
    if (categoryId === undefined) {
        throw {code: 400, message: "Category ID is required"};
    }

    // Check if the category ID is valid
    if (isNaN(categoryId)) {
        throw {code: 400, message: "Category ID must be a number"};
    } else if (categoryId <= 0) {
        throw {code: 400, message: "Category ID must be greater than 0"};
    }

    // Check if the category exists
    const foundCategory = await db.categories.findByPk(categoryId);
    if (!foundCategory) {
        throw {code: 404, message: "Category not found"};
    }

    return foundCategory;
}

async function checkIngredientId(ingredientId) {
    // Check if the ingredient ID is undefined
    if (ingredientId === undefined) {
        throw {code: 400, message: "Ingredient ID is required"};
    }

    // Check if the ingredient ID is valid
    if (isNaN(ingredientId)) {
        throw {code: 400, message: "Ingredient ID must be a number"};
    } else if (ingredientId <= 0) {
        throw {code: 400, message: "Ingredient ID must be greater than 0"};
    }

    // Check if the ingredient exists
    const foundIngredient = await db.ingredients.findByPk(ingredientId);
    if (!foundIngredient) {
        throw {code: 404, message: "Ingredient not found"};
    }

    return foundIngredient;
}

async function checkOptionGroupId(optionGroupId) {
    // Check if the optionGroup ID is undefined
    if (optionGroupId === undefined) {
        throw {code: 400, message: "OptionGroup ID is required"};
    }

    // Check if the optionGroup ID is valid
    if (isNaN(optionGroupId) || optionGroupId <= 0) {
        throw {code: 400, message: "Invalid optionGroup ID"};
    }

    // Check if the optionGroup exists
    const foundOptionGroup = await db.optionGroups.findByPk(optionGroupId);
    if (!foundOptionGroup) {
        throw {code: 404, message: "OptionGroup not found"};
    }

    return foundOptionGroup;
}

function checkProductDetails(productDetails) {
    // The details to return
    let details = {};

    // Check if the name is set
    if (productDetails.name != undefined) {
        if (typeof productDetails.name !== "string") {
            throw {code: 400, message: "Name must be a string"};
        }
        if (productDetails.name.trim() === "") {
            throw {code: 400, message: "Name must not be empty"};
        }
        details.name = productDetails.name;
    } else {throw {code: 400, message: "Name is required"};}
    
    // Check if the description is set
    if (productDetails.description != undefined) {
        if (typeof productDetails.description !== "string") {
            throw {code: 400, message: "Description must be a string"};
        }
        if (productDetails.description.trim() === "") {
            throw {code: 400, message: "Description must not be empty"};
        }
        details.description = productDetails.description;
    } else {throw {code: 400, message: "Description is required"};}

    // Check if the price is set
    if (productDetails.price != undefined) {
        if (typeof productDetails.price !== "number") {
            throw {code: 400, message: "Price must be a decimal number"};
        }
        if (productDetails.price < 0) {
            throw {code: 400, message: "Price cannot be negative"};
        }
        details.price = productDetails.price;
    } else {
        throw {code: 400, message: "Price is required"};
    }

    // Check if the photo is set
    if (productDetails.photo != undefined) {
        if (typeof productDetails.photo !== "string") {
            throw {code: 400, message: "Photo must be a string"};
        }
        if (productDetails.photo.trim() === "") {
            throw {code: 400, message: "Photo must not be empty"};
        }
        details.photo = productDetails.photo;
    }

    return details;
}

// Check for an id and return updatedProducts
async function getUpdatedProduct(details) {
    // This is the return product structure
    const updatedProduct = {};

    // Check if the name is set
    if (details.name != undefined) {
        if (typeof details.name !== "string") {
            throw {code: 400, message: "Name must be a string"};
        }
        if (details.name.trim() === "") {
            throw {code: 400, message: "Name must not be empty"};
        }

        updatedProduct.name = details.name;
    }

    // Check if the description is set
    if (details.description != undefined) {
        if (typeof details.description !== "string") {
            throw {code: 400, message: "Description must be a string"};
        }
        if (details.description.trim() === "") {
            throw {code: 400, message: "Description must not be empty"};
        }

        updatedProduct.description = details.description;
    }

    // Check if the price is set
    if (details.price != undefined) {
        if (typeof details.price !== "number") {
            throw {code: 400, message: "Price must be a decimal number"};
        }
        if (details.price < 0) {
            throw {code: 400, message: "Price cannot be negative"};
        }

        updatedProduct.price = details.price;
    }

    // Check if the photo is set
    // The photo will have to be 
    // processed outside of this function
    if (details.photo != undefined) {
        if (typeof details.photo !== "string") {
            throw {code: 400, message: "Photo must be a string"};
        }
        if (details.photo.trim() === "") {
            throw {code: 400, message: "Photo must not be empty"};
        }

        updatedProduct.photo = details.photo;
    }

    // Return the updated product
    return updatedProduct;
}




////////////////////
//    Requests    //
////////////////////

// GET: /
async function getAllProducts(req, res) {
    /**
     * Body: null
     */
    try {
        // No inputs to check
        /////////////////////
        //  Preform logic  //
        /////////////////////

        // Get all products
        var menuItems = await db.products.findAll({
            attributes: ["id", "name", "description", "price", "photo"],
            include: [
                {
                    model: db.ingredients,
                    as: "ingredients",
                    through: {
                        attributes: ["quantity", "measurement"]
                    },
                    attributes: ["id", "name", "description", "price", "photo"]
                },
                {
                    model: db.categories,
                    as: "categories",
                    through: {
                        model: db.categoriesToProducts,
                        attributes: []
                    }
                },
                {
                    model: db.optionGroups,
                    as: "optionGroups",
                    attributes: [
                        "id", 
                        "sectionName",
                        "multipleChoice",
                        "required"
                    ],
                    include: [
                        {
                            model: db.options,
                            as: "options",
                            attributes: [
                                "id", 
                                "priceAdjustment", 
                                "minQuantity", 
                                "maxQuantity",
                                "defaultQuantity"
                            ],
                            include: [
                                {
                                    model: db.ingredients,
                                    as: "ingredient",
                                    attributes: [
                                        "id", 
                                        "name", 
                                        "description", 
                                        "price", 
                                        "photo"
                                    ]
                                }
                            ],
                            through: {
                                model: db.optionsToGroups,
                                attributes: []
                            }
                        }
                    ],
                }
            ],
        });

        // Clean the response
        menuItems = cleanProduct(JSON.parse(JSON.stringify(menuItems)));


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: menuItems
        });
    } catch (error) {
        return sendError(res, error, "Failed to get all products");
    }
};

// GET: /:id
async function getProductById(req, res) {
    /**
     * Body: null
     */
    try {
        //////////////////////////
        //  Run checks on input //
        //////////////////////////
        await checkProductId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get the product
        const product = await db.products.findByPk(req.params.id, {
            attributes: ["id", "name", "description", "price", "photo"],
            include: [
                {
                    model: db.ingredients,
                    as: "ingredients",
                    through: {
                        attributes: ["quantity", "measurement"]
                    },
                    attributes: ["id", "name", "description", "price", "photo"]
                },
                {
                    model: db.categories,
                    as: "categories",
                    through: {
                        model: db.categoriesToProducts,
                        attributes: []
                    }
                },
                {
                    model: db.optionGroups,
                    as: "optionGroups",
                    attributes: [
                        "id", 
                        "sectionName",
                        "multipleChoice",
                        "required"
                    ],
                    include: [
                        {
                            model: db.options,
                            as: "options",
                            attributes: [
                                "id", 
                                "priceAdjustment", 
                                "minQuantity", 
                                "maxQuantity",
                                "defaultQuantity"
                            ],
                            include: [
                                {
                                    model: db.ingredients,
                                    as: "ingredient",
                                    attributes: [
                                        "id", 
                                        "name", 
                                        "description", 
                                        "price", 
                                        "photo"
                                    ]
                                }
                            ],
                            through: {
                                model: db.optionsToGroups,
                                attributes: []
                            }
                        }
                    ],
                }
            ],
        });

        // Clean the response
        var productDetails = cleanProduct(JSON.parse(JSON.stringify(product)));

        // Make sure we only have one product
        if (productDetails.length > 1) {
            throw {code: 500, message: "Multiple products found"};
        }


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: productDetails[0]
        });
    } catch (error) {
        return sendError(res, error, "Failed to get product by ID");
    }
};

// POST: /create
async function createProduct(req, res) {
    /**
     * Body: {
     *     id: 1,
     *     name: "New Name",
     *     description: "New Description",
     *     price: 10.00,
     *     photo: "base64EncodedString",
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        var productDetails = await checkProductDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Convert the photo to a file
        if (productDetails.photo != undefined) {
            productDetails.photo = await savePhoto(productDetails.photo);
        }

        // Create the product
        const newProduct = await db.products.create(productDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: newProduct
        });

    // Catch any errors
    } catch (error) {
        return sendError(res, error, "Failed to create product");
    }
};

// PUT: /update/:id
async function updateProduct(req, res) {
    /**
     * Body: {
     *     id: 1,
     *     name: "New Name",
     *     description: "New Description",
     *     price: 10.00,
     *     photo: "base64EncodedString",
     * }
     */
    try {
        ///////////////////////////
        //  Run checks in input  //
        ///////////////////////////
        
        // Check that the paths id is the same as the body id
        if (req.params.id != req.body.id) {
            throw {code: 400, message: "Product ID mismatch"};
        }
        const product = await checkProductId(req.params.id);
        var updateProductDetails = await getUpdatedProduct(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the photo is set
        if (updateProductDetails.photo != undefined) {
            updateProductDetails.photo = await savePhoto(updateProductDetails.photo);
        }

        // Update the product
        await product.update(updateProductDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
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

// DELETE: /delete/:id
async function deleteProduct(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await product.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            message: "Product deleted successfully"
        });
    } catch (error) {
        return sendError(res, error, "Failed to delete product");
    }
};



// POST: /:id/categories
async function addCategory(req, res) {
    /**
     * Body: {
     *    id: 1
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const category = await checkCategoryId(req.body.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the category is already linked to the product
        const check = await product.getCategories({
            where: {
                id: category.id
            }
        });
        if (check.length > 0) {
            throw {code: 409, message: "Category already linked to product"};
        }

        // Add the category to the product
        await product.addCategory(category);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Category added successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to add category");
    }
}

// DELETE: /:id/categories/:categoryId
async function removeCategory(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const category = await checkCategoryId(req.params.categoryId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the category is linked to the product
        const check = await product.getCategories({
            where: {
                id: category.id
            }
        });
        if (check.length === 0) {
            throw {code: 404, message: "Category is not linked to product"};
        }

        // Remove the category from the product
        await product.removeCategory(category);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Category removed successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to remove category");
    }
}


// POST: /:id/optionGroups
async function addOptionGroup(req, res) {
    /**
     * Body: {
     *    id: 1
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const optionGroup = await checkOptionGroupId(req.body.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the optionGroup is linked to the product
        const check = await product.getOptionGroups({
            where: {
                id: optionGroup.id
            }
        });
        if (check.length > 0) {
            throw {code: 200, status: "success", message: "OptionGroup already linked to product"};
        }

        // Add the optionGroup to the product
        await product.addOptionGroup(optionGroup);

        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "OptionGroup added successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to add optionGroup");
    }
}

// DELETE: /:id/optionGroups
async function removeOptionGroup(req, res) {
    /**
     * Body: {
     *    id: 1
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const optionGroup = await checkOptionGroupId(req.body.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        
        // Check if the optionGroup is linked to the product
        const check = await product.getOptionGroups({
            where: {
                id: optionGroup.id
            }
        });
        if (check.length === 0) {
            throw {code: 404, message: "OptionGroup is not linked to product"};
        }

        // Remove the optionGroup from the product
        await product.removeOptionGroup(optionGroup);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "OptionGroup removed successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to remove optionGroup");
    }
}


// POST: /:id/ingredients
async function addIngredient(req, res) {
    /**
     * Body: {
     *    id: 1,
     *    quantity: 1,
     *    measurement: "unit"
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const ingredient = await checkIngredientId(req.body.id);
        const quantity = req.body.quantity;
        const measurement = req.body.measurement;

        if (quantity === undefined || isNaN(quantity)) {
            throw {code: 400, message: "Ingredient quantity is required"};
        }
        if (measurement === undefined || measurement.trim() === "") {
            throw {code: 400, message: "Ingredient measurement is required"};
        }


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Make sure the ingredient is not already linked to the product
        const check = await product.getIngredients({
            where: {
                id: ingredient.id
            }
        });
        if (check.length > 0) {
            throw {code: 409, message: "Ingredient already linked to product"};
        }

        // Link the ingredient to the product
        await product.addIngredient(ingredient.id, {
            through: {
                quantity: quantity,
                measurement: measurement
            }
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Ingredient added successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to add ingredient");
    }
}

// PUT: /:id/ingredients
// NOTE: This does not update the ingredient itself,
//       only the link from the product to the ingredient
async function updateIngredient(req, res) {
    /**
     * Body: {
     *     id: 1,
     *     quantity: 1,
     *     measurement: "unit"
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const ingredient = await checkIngredientId(req.body.id);
        const quantity = req.body.quantity;
        const measurement = req.body.measurement;

        // Check if the quantity is set 
        if (quantity != undefined) {
            if (typeof quantity !== "number") {
                throw {code: 400, message: "Ingredient quantity must be a number"};
            }
            if (quantity <= 0) {
                throw {code: 400, message: "Ingredient quantity must be greater than 0"};
            }
        } 
        if (measurement != undefined) {
            if (typeof measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        }
        if (quantity === undefined && measurement === undefined) {
            throw {code: 400, message: "Ingredient needs quantity or measurement to update"};
        }


        /////////////////////
        //  Perform logic  //
        /////////////////////
        
        // Get the ingredient link
        const ingredients = await product.getIngredients({
            where: {
                id: ingredient.id
            }
        });
        if (ingredients.length === 0) {
            throw {code: 200, status: "success", message: "Ingredient is not linked to product"};
        }

        // Update the ingredient link
        await ingredients[0].ingredientsToProducts.update({
            quantity: quantity !== undefined ? quantity : ingredients[0].ingredientsToProducts.quantity,
            measurement: measurement !== undefined ? measurement : ingredients[0].ingredientsToProducts.measurement
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Ingredient updated successfully"
            }
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to update ingredient");
    }
}

// DELETE: /:id/ingredients/:ingredientId
async function removeIngredient(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const product = await checkProductId(req.params.id);
        const ingredient = await checkIngredientId(req.params.ingredientId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the ingredient is linked to the product
        const check = await product.getIngredients({
            where: {
                id: ingredient.id
            }
        });
        if (check.length === 0) {
            throw {code: 404, message: "Ingredient is not linked to product"};
        }

        // Remove the ingredient from the product
        await product.removeIngredient(ingredient);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            message: "Ingredient removed successfully"
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to remove ingredient");
    }
}




export default {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,

    addCategory,
    removeCategory,
    addOptionGroup,
    removeOptionGroup,
    addIngredient,
    updateIngredient,
    removeIngredient
}