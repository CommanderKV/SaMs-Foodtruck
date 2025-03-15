import db from '../models/index.js';
import savePhoto from '../tools/photoSaver.js';

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
        console.log(`${message} --ERROR-- ${error}`);
        return res.status(500).json({
            status: "failure",
            message: message
        });
    }
}

function checkGetProduct(products) {
    // Make sure products is an array
    if (!Array.isArray(products)) {
        products = [products];
    }

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

    return products;
}

async function checkProductId(productId) {
    // Check if the product ID is valid
    if (isNaN(productId) || productId <= 0) {
        throw {code: 400, message: "Invalid product ID"};
    }

    // Check if the product exists
    const foundProduct = await db.products.findByPk(productId);
    if (!foundProduct) {
        throw {code: 404, message: "Product not found"};
    }
    
    return foundProduct;
}

async function checkCategoryId(categoryId) {
    // Check if the category ID is valid
    if (isNaN(categoryId) || categoryId <= 0) {
        throw {code: 400, message: "Invalid category ID"};
    }

    // Check if the category exists
    const foundCategory = await db.categories.findByPk(categoryId);
    if (!foundCategory) {
        throw {code: 404, message: "Category not found"};
    }

    return foundCategory;
}

async function checkIngredientId(ingredientId) {
    // Check if the ingredient ID is valid
    if (isNaN(ingredientId) || ingredientId <= 0) {
        throw {code: 400, message: "Invalid ingredient ID"};
    }

    // Check if the ingredient exists
    const foundIngredient = await db.ingredients.findByPk(ingredientId);
    if (!foundIngredient) {
        throw {code: 404, message: "Ingredient not found"};
    }

    return foundIngredient;
}

async function checkOptionGroupId(optionGroupId) {
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





////////////////////
//    Requests    //
////////////////////

// GET: /
async function getAllProducts(req, res) {
    try {
        ////////////////////////
        // Get all menu items //
        ////////////////////////
        var menuItems = await db.products.findAll({
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
                },
                {
                    model: db.optionGroups,
                    as: "optionGroups",
                    attributes: ["id", "sectionName"],
                    include: [
                        {
                            model: db.options,
                            as: "options",
                            attributes: [
                                "id", 
                                "priceAdjustment", 
                                "multipleChoice", 
                                "minQuantity", 
                                "maxQuantity"
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
                            ]
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });

        // Check the response
        menuItems = checkGetProduct(menuItems);

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
};

// GET: /:id
async function getProductById(req, res) {
    try {
        const productId = req.params.id;

        // Check if the product ID is valid
        if (isNaN(productId) || productId <= 0) {
            throw {code: 400, message: "Invalid product ID"};
        }

        ///////////////////////
        // Get the menu item //
        ///////////////////////
        var product = await db.products.findByPk(productId, {
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
                },
                {
                    model: db.optionGroups,
                    as: "optionGroups",
                    attributes: ["id", "sectionName"],
                    include: [
                        {
                            model: db.options,
                            as: "options",
                            attributes: [
                                "id", 
                                "priceAdjustment", 
                                "multipleChoice", 
                                "minQuantity", 
                                "maxQuantity"
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
                            ]
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });
        if (!product) {
            throw {code: 404, message: "Product not found"}
        }

        // Check the response
        product = checkGetProduct(product);

        // Return the product details
        res.status(200).json({
            status: "success",
            data: product
        });
    } catch (error) {
        return sendError(res, error, "Failed to get product by ID");
    }
};

// Check all product details
function checkProductDetails(productDetails) {
    // Check if the name is set
    if (productDetails.name != undefined) {
        if (typeof productDetails.name !== "string") {
            throw {code: 400, message: "Name must be a string"};
        }
        if (productDetails.name.trim() === "") {
            throw {code: 400, message: "Name must not be empty"};
        }
    } else {throw {code: 400, message: "Name is required"};}
    
    // Check if the description is set
    if (productDetails.description != undefined) {
        if (typeof productDetails.description !== "string") {
            throw {code: 400, message: "Description must be a string"};
        }
        if (productDetails.description.trim() === "") {
            throw {code: 400, message: "Description must not be empty"};
        }
    } else {throw {code: 400, message: "Description is required"};}

    // Check if the price is set
    if (productDetails.price != undefined) {
        if (typeof productDetails.price !== "number") {
            throw {code: 400, message: "Price must be a decimal number"};
        }
        if (productDetails.price <= 0) {
            throw {code: 400, message: "Price must be greater than 0"};
        }
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
    }else {
        throw {code: 400, message: "Photo is required"};
    }
}

// Check all ingredient details
async function checkIngredientDetails(ingredients) {
    // Make sure ingredients are arrays
    if (!Array.isArray(ingredients)) {
        throw {code: 400, message: "Ingredients must be an array"};
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw {code: 400, message: "Ingredient ID must be a number"};
            }
            if (ingredient.id <= 0) {
                throw {code: 400, message: "Invalid ingredient ID"};
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw {code: 404, message: "Ingredient not found"};
            }
        } else {
            throw {code: 400, message: "Ingredient ID is required"};
        }

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw {code: 400, message: "Ingredient quantity must be a number"};
            }
            if (ingredient.quantity <= 0) {
                throw {code: 400, message: "Ingredient quantity must be greater than 0"};
            }
        } else {throw {code: 400, message: "Ingredient quantity is required"};}

        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (ingredient.measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        } else {throw {code: 400, message: "Ingredient measurement is required"};}
    }
}

// POST: /create
async function createProduct(req, res) {
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

        ////////////////////////////
        //  Check for categories  //
        ////////////////////////////
        if (newProductDetails.categories != undefined && Array.isArray(newProductDetails.categories)) {
            const categories = newProductDetails.categories;
            for (const category of categories) {
                if (typeof category !== "number") {
                    throw {code: 400, message: "Category ID must be a number"};
                }
                if (category <= 0) {
                    throw {code: 400, message: "Invalid category ID"};
                }

                // Check to see if the category exists
                const foundCategory = await db.categories.findOne({ where: { id: category } });
                if (!foundCategory) {
                    throw {code: 404, message: `Category with ${category} id not found`};
                }

                // Add the category to the product
                await newProduct.addCategory(category);
            }
        }

        ///////////////////////
        // Check for options //
        ///////////////////////
        if (newProductDetails.options != undefined && Array.isArray(newProductDetails.options)) {
            const options = newProductDetails.options;
            for (const group of options) {
                // Check the sectionName
                if (group.sectionName === undefined || typeof group.sectionName !== "string" || group.sectionName.trim() === "") {
                    throw {code: 400, message: "OptionGroup sectionName is required"};
                }
                
                // Create the option group
                const newOptionGroup = await newProduct.createOptionGroup({
                    sectionName: group.sectionName
                });

                // Check the options
                if (group.items === undefined || !Array.isArray(group.items)) {
                    newOptionGroup.destroy();
                    throw {code: 400, message: "OptionGroup items must be an array"};
                }

                // Loop through the items and creating the options
                for (const item of group.items) {
                    // Check the price adjustment
                    if (item.priceAdjustment === undefined || typeof item.priceAdjustment !== "number") {
                        newOptionGroup.destroy();
                        throw {code: 400, message: "Option priceAdjustment is required"};
                    }

                    // Check the multiple choice
                    if (item.multipleChoice !== undefined && typeof item.multipleChoice !== "boolean") {
                        newOptionGroup.destroy();
                        throw {code: 400, message: "Option multipleChoice must be a boolean"};
                    }

                    // Check the minQuantity
                    if (item.minQuantity !== undefined && (typeof item.minQuantity !== "number" || item.minQuantity < 0)) {
                        newOptionGroup.destroy();
                        throw {code: 400, message: "Option minQuantity must be >= 0"};
                    }

                    // Check the maxQuantity
                    if (item.maxQuantity !== undefined && (typeof item.maxQuantity !== "number" || item.maxQuantity < 1)) {
                        newOptionGroup.destroy();
                        throw {code: 400, message: "Option maxQuantity must be >= 1"};
                    }

                    // Check the ingredient ID
                    if (item.ingredientId === undefined || typeof item.ingredientId !== "number" || item.ingredientId <= 0) {
                        newOptionGroup.destroy();
                        throw {code: 400, message: "Option ingredientId is required"};
                    }

                    const ingredient = await db.ingredients.findByPk(item.ingredientId);
                    if (!ingredient) {
                        newOptionGroup.destroy();
                        throw {code: 404, message: "Ingredient not found"};
                    }

                    // Create the option
                    await newOptionGroup.createOption({
                        priceAdjustment: item.priceAdjustment,
                        multipleChoice: item.multipleChoice,
                        minQuantity: item.minQuantity,
                        maxQuantity: item.maxQuantity,
                        ingredientId: item.ingredientId
                    });
                }
            }
        }

        // Send response
        res.status(201).json({
            status: "success",
            data: newProduct
        });

    // Catch any errors
    } catch (error) {
        return sendError(res, error, "Failed to create product");
    }
};

// Check for an id and return updatedProducts
async function getUpdatedProduct(updatedProductDetails, id) {
    // Check to make sure a product id is given
    if (updatedProductDetails.id != undefined || id != undefined) {
        if (typeof updatedProductDetails.id !== "number" || typeof id !== "number") { 
            throw {code: 400, message: "Product ID must be a number"}; 
        }
        if (updatedProductDetails.id <= 0 || id <= 0) { 
            throw {code: 400, message: "Invalid product ID"}; 
        }
        if (updatedProductDetails.id != id) {
            throw {code: 400, message: "Product ID mismatch"};
        }

        const foundProduct = await db.products.findByPk(updatedProductDetails.id);
        if (!foundProduct) {
            throw {code: 404, message: "Product not found"};
        }
    } else { 
        throw {code: 400, message: "Product ID is required"}; 
    }

    // Create updated product values
    let updatedProduct = {};
    for (const key in updatedProductDetails) {
        if (updatedProductDetails[key] != undefined && (key != "id" || key != "photo")) {
            updatedProduct[key] = updatedProductDetails[key];
        }
    }
    if (updatedProductDetails.photo != undefined) {
        updatedProduct.photo = await savePhoto(updatedProductDetails.photo);
    }

    return updatedProduct;
}

async function checkIngredientDetailsForUpdate(ingredients) {
    // Make sure ingredients are arrays
    if (!Array.isArray(ingredients)) {
        throw {code: 400, message: "Ingredients must be an array"};
    }

    // Go through each ingredient
    for (const ingredient of ingredients) {
        // Check if the id is set
        if (ingredient.id != undefined) {
            if (typeof ingredient.id !== "number") {
                throw {code: 400, message: "Ingredient ID must be a number"};
            }
            if (ingredient.id <= 0) {
                throw {code: 400, message: "Invalid ingredient ID"};
            }
            
            // Check the ingredient ID
            const foundIngredient = await db.ingredients.findOne({ where: { id: ingredient.id } });
            if (!foundIngredient) {
                throw {code: 404, message: "Ingredient not found"};
            }
        } else {throw {code: 400, message: "Ingredient ID is required"};}

        // Check if the quantity is set
        if (ingredient.quantity != undefined) {
            if (typeof ingredient.quantity !== "number") {
                throw {code: 400, message: "Ingredient quantity must be a number"};
            }
            if (ingredient.quantity <= 0) {
                throw {code: 400, message: "Ingredient quantity must be greater than 0"};
            }
        }

        // Check if the measurement is set
        if (ingredient.measurement != undefined) {
            if (typeof ingredient.measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (ingredient.measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        }
        
        if (ingredient.quantity === undefined && ingredient.measurement === undefined){
            throw {code: 400, message: "Ingredient needs quantity or measurement"};
        }
    }
}

async function checkCategories(categories) {
    // Check if we have either of th proper keys
    if (categories.add == undefined && categories.remove == undefined) {
        throw {code: 400, message: "Categories must have either add or remove options"};
    }
    
    // Check if the add key is an array
    if (categories.add != undefined) {
        if (!Array.isArray(categories.add)) {
            throw {code: 400, message: "Add categories must be an array"};
        }
        
        // Check to make sure all values are numbers
        for (const category of categories.add) {
            if (typeof category !== "number") {
                throw {code: 400, message: "Category ID must be a number"};
            }
            if (category <= 0) {
                throw {code: 400, message: "Invalid category ID"};
            }

            // Check to see if the category exists
            const foundCategory = await db.categories.findOne({ where: { id: category } });
            if (!foundCategory) {
                throw {code: 404, message: `Category with ${category} id not found`};
            }
        }
    }

    // Check if the remove key is an array
    if (categories.remove != undefined) {
        if (!Array.isArray(categories.remove)) {
            throw {code: 400, message: "Remove categories must be an array"};
        }

        // Check to make sure all values are numbers
        for (const category of categories.remove) {
            if (typeof category !== "number") {
                throw {code: 400, message: "Category ID must be a number"};
            }
            if (category <= 0) {
                throw {code: 400, message: "Invalid category ID"};
            }

            // Check to see if the category exists
            const foundCategory = await db.categories.findOne({ where: { id: category } });
            if (!foundCategory) {
                throw {code: 404, message: `Category with ${category} id not found`};
            }
        }
    }

    return categories;
}

// Check the options for updates
async function checkUpdateOptions(options) {
    // Make sure that the options are an array
    if (!Array.isArray(options)) {
        throw {code: 400, message: "Options must be an array"};
    }

    // Check the optionGroups
    for (const optionGroup of options) {
        // Check if the ID is set
        if (optionGroup.id != undefined) {
            if (typeof optionGroup.id !== "number") {
                throw {code: 400, message: "OptionGroup ID must be a number"};
            }
            if (optionGroup.id <= 0) {
                throw {code: 400, message: "Invalid OptionGroup ID"};
            }

            // Make sure the optionGroup exists
            if (!await db.optionGroups.findOne({ where: { id: optionGroup.id } })) {
                throw {code: 404, message: "OptionGroup not found"};
            }
        } else {throw {code: 400, message: "OptionGroup ID is required"};}

        // Check if the sectionName is set
        if (optionGroup.sectionName != undefined) {
            if (typeof optionGroup.sectionName !== "string") {
                throw {code: 400, message: "OptionGroup sectionName must be a string"};
            }
            if (optionGroup.sectionName.trim() === "") {
                throw {code: 400, message: "OptionGroup sectionName must not be empty"};
            }
        }

        // Check the items if set
        if (optionGroup.items != undefined) {
            if (!Array.isArray(optionGroup.items)) {
                throw {code: 400, message: "OptionGroup items must be an array"};
            }

            // Check the items
            for (const option of optionGroup.items) {
                // Check if the ID is set
                if (option.id != undefined) {
                    if (typeof option.id !== "number") {
                        throw {code: 400, message: "Option ID must be a number"};
                    }
                    if (option.id <= 0) {
                        throw {code: 400, message: "Invalid Option ID"};
                    }

                    // Make sure the option exists
                    if (!await db.options.findOne({ where: { id: option.id } })) {
                        throw {code: 404, message: "Option not found"};
                    }
                } else {throw {code: 400, message: "Option ID is required"};}

                // Check if the ingredient ID is set
                if (option.ingredientId != undefined) {
                    if (typeof option.ingredientId !== "number") {
                        throw {code: 400, message: "Option ingredientId must be a number"};
                    }
                    if (option.ingredientId <= 0) {
                        throw {code: 400, message: "Invalid Option ingredientId"};
                    }

                    // Make sure the ingredient exists
                    if (!await db.ingredients.findByPk(option.ingredientId)) {
                        throw {code: 404, message: "Ingredient not found"};
                    }
                }

                // Check if the priceAdjustment is set
                if (option.priceAdjustment != undefined) {
                    if (typeof option.priceAdjustment !== "number") {
                        throw {code: 400, message: "Option priceAdjustment must be a number"};
                    }
                }

                // Check if the multipleChoice is set
                if (option.multipleChoice != undefined) {
                    if (typeof option.multipleChoice !== "boolean") {
                        throw {code: 400, message: "Option multipleChoice must be a boolean"};
                    }
                }

                // Check if the minQuantity is set
                if (option.minQuantity != undefined) {
                    if (typeof option.minQuantity !== "number") {
                        throw {code: 400, message: "Option minQuantity must be a number"};
                    }
                    if (option.minQuantity < 0) {
                        throw {code: 400, message: "Option minQuantity must be >= 0"};
                    }
                }

                // Check if the maxQuantity is set
                if (option.maxQuantity != undefined) {
                    if (typeof option.maxQuantity !== "number") {
                        throw {code: 400, message: "Option maxQuantity must be a number"};
                    }
                    if (option.maxQuantity < 1) {
                        throw {code: 400, message: "Option maxQuantity must be >= 1"};
                    }
                }

                // Check if the remove is set
                if (option.remove != undefined) {
                    if (typeof option.remove !== "boolean") {
                        throw {code: 400, message: "Option remove must be a boolean"};
                    }
                }
            }
        }

        // Check if the remove is set
        if (optionGroup.remove != undefined) {
            if (typeof optionGroup.remove !== "boolean") {
                throw {code: 400, message: "OptionGroup remove must be a boolean"};
            }
        }
    }
}

// PUT: /update/:id
async function updateProduct(req, res) {
    try {
        const updatedProductDetails = req.body;
        const productId = req.params.id !== undefined ? Number(req.params.id) : undefined;
        
        /////////////////////////////
        //  Check body parameters  //
        /////////////////////////////
        // Get the updated product
        const updatedProduct = await getUpdatedProduct(updatedProductDetails, productId);

        // Check the ingredients
        if (updatedProductDetails.ingredients != undefined) {
            await checkIngredientDetailsForUpdate(updatedProductDetails.ingredients)
        }

        // If the product doesn't need to be updated
        // then don't touch the product
        const product = await db.products.findByPk(updatedProductDetails.id);
        if (Object.keys(updatedProduct).length !== 0) {
            // Update product parameters
            await db.products.update(
                updatedProduct, 
                { 
                    where: { 
                        id: updatedProductDetails.id
                    } 
                }
            );
        }

        // Update ingredients
        if (updatedProductDetails.ingredients != undefined) {
            // Structure
            // ingredients: [
            //     {
            //          id: 1,
            //          quantity: 1, Optional
            //          measurement: "cup", Optional
            //          remove: true Optional
            //     },
            //     ...
            // ]
            const ingredients = await product.getIngredients();

            // Create a map of ingredients
            const ingredientLinks = updatedProductDetails.ingredients;
            const updateIngredients = ingredientLinks.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});
            const prevIngredients = ingredients.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});

            // Loop through the updated ingredients
            for (const id of Object.keys(updateIngredients)) {
                const updateIngredient = updateIngredients[id];

                // Check if we want to remove the ingredient link
                if (updateIngredient.remove != undefined) {
                    await product.removeIngredient(id);
                }

                // Check if we want to add a new ingredient link
                if (prevIngredients[id] === undefined) {
                    let update = {};
                    if (updateIngredients[id].quantity === undefined) {
                        throw {code: 400, message: "Ingredient quantity is required"};
                    } else {
                        update.quantity = updateIngredients[id].quantity;
                    }
                    
                    if (updateIngredients[id].measurement === undefined) {
                        throw {code: 400, message: "Ingredient measurement is required"};
                    } else {
                        update.measurement = updateIngredients[id].measurement;
                    }

                    await product.addIngredient(id, {through: update});
                
                // Check if we want to update an existing ingredient link
                } else {
                    let ingredient = prevIngredients[id];
                    let update = {};
                    if (updateIngredients[id].quantity != undefined) {
                        update.quantity = updateIngredients[id].quantity;
                    }
                    if (updateIngredients[id].measurement != undefined) {
                        update.measurement = updateIngredients[id].measurement;
                    }

                    await ingredient.ingredientsToProducts.update(update);
                }
            }
        }

        // Update categories
        if (updatedProductDetails.categories != undefined) {
            // Structure
            // categories: {
            //   add: [1, 2, 3],
            //   remove: [4, 5, 6]
            // }
            const categories = await checkCategories(updatedProductDetails.categories);
            const product = await db.products.findByPk(updatedProductDetails.id);
            const currentCategories = await product.getCategories();

            // Loop through the current categories
            for (const category of currentCategories) {
                let id = category.id;
                
                // Remove the category if it's in the remove list
                // and in the current categories 
                if (categories.remove != undefined && categories.remove.includes(id)) {
                    await product.removeCategory(id);
                }

                // Add the category if it's in the add list
                // and not in the current categories
                if (categories.add != undefined && !categories.add.includes(id)) {
                    await product.addCategory(id);
                }
            }
        }

        // Update the options
        if (updatedProductDetails.options != undefined) {
            // Structure
            // options: [
            //     {
            //         id: 1,
            //         sectionName: "Toppings",
            //         items: [
            //             {
            //                 id: 1,
            //                 priceAdjustment: 0.50,
            //                 multipleChoice: true,
            //                 minQuantity: 1,
            //                 maxQuantity: 1,
            //                 remove: true,
            //                 ingredientId: 1
            //             }
            //         ],
            //         remove: true
            //     },
            //     ...
            // ]
            
            // Get the options
            const options = updatedProductDetails.options;
            
            // Check the options
            await checkUpdateOptions(options);

            // Make mappings of the options
            const productOptionGroups = await product.getOptionGroups();
            const currentOptionGroups = productOptionGroups.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});
            const optionGroups = options.reduce((acc, x) => {
                acc[x.id] = x;
                return acc;
            }, {});

            // Go through each optionGroup
            for (const id of Object.keys(optionGroups)) {
                const optionGroup = optionGroups[id];

                // Check if we want to remove the option group
                if (optionGroup.remove != undefined) {
                    await product.removeOptionGroup(id);
                }

                // Check if we want to add a new option group
                if (currentOptionGroups[id] === undefined) {
                    if (optionGroup.sectionName === undefined) {
                        throw {code: 400, message: "OptionGroup sectionName is required"};
                    }

                    // Make the new option group
                    const newOptionGroup = await db.optionGroups.create({
                        sectionName: update.sectionName
                    });

                    // Loop through the items and creating the options
                    for (const item of optionGroup.items) {
                        let update = {};
                        
                        // Get the parameters for the new option
                        if (item.ingredientId === undefined) {
                            throw {code: 400, message: "Option ingredientId is required"};
                        } else {
                            update.ingredientId = item.ingredientId;
                        }
                        if (item.priceAdjustment !== undefined) {
                            update.priceAdjustment = item.priceAdjustment;
                        }
                        if (item.multipleChoice !== undefined) {
                            update.multipleChoice = item.multipleChoice;
                        }
                        if (item.minQuantity !== undefined) {
                            update.minQuantity = item.minQuantity;
                        }
                        if (item.maxQuantity !== undefined) {
                            update.maxQuantity = item.maxQuantity;
                        }

                        // Create the new option
                        const newOption = await newOptionGroup.createOption(update);

                        // Add the ingredient to the option
                        await newOption.setIngredient(item.ingredientId);
                    }

                // Check if we want to update an existing option group
                } else {
                    const existingOptionGroup = currentOptionGroups[id];

                    // Update the section name
                    if (optionGroup.sectionName !== undefined) {
                        existingOptionGroup.sectionName = optionGroup.sectionName;
                        await existingOptionGroup.save();
                    }

                    // Loop through the items and update the options
                    for (const item of optionGroup.items) {
                        // Remove the option
                        if (item.remove) {
                            await existingOptionGroup.removeOption(item.id);
                        
                        // Add the option
                        } else {
                            // Check if the option exists or not
                            const existingOption = await db.options.findByPk(item.id);
                            if (existingOption) {
                                await existingOption.update({
                                    priceAdjustment: item.priceAdjustment !== undefined ? item.priceAdjustment : existingOption.priceAdjustment,
                                    multipleChoice: item.multipleChoice !== undefined ? item.multipleChoice : existingOption.multipleChoice,
                                    minQuantity: item.minQuantity !== undefined ? item.minQuantity : existingOption.minQuantity,
                                    maxQuantity: item.maxQuantity !== undefined ? item.maxQuantity : existingOption.maxQuantity
                                });

                                // Check if the ingredient needs to be updated
                                if (item.ingredientId !== undefined) {
                                    if (typeof item.ingredientId !== "number") {
                                        throw {code: 400, message: "Option ingredientId must be a number"};
                                    }
                                    if (item.ingredientId <= 0) {
                                        throw {code: 400, message: "Invalid Option ingredientId"};
                                    }

                                    if (!await db.ingredients.findByPk(item.ingredientId)) {
                                        throw {code: 404, message: "Ingredient not found"};
                                    }
                                    await existingOption.setIngredient(item.ingredientId);
                                }
                            
                            // Make a new option
                            } else {
                                // Make sure the id is set
                                if (item.ingredientId !== undefined) {
                                    if (typeof item.ingredientId !== "number") {
                                        throw {code: 400, message: "Option ingredientId must be a number"};
                                    }
                                    if (item.ingredientId <= 0) {
                                        throw {code: 400, message: "Invalid Option ingredientId"};
                                    }

                                    // Make sure the ingredient exists
                                    if (!await db.ingredients.findByPk(item.ingredientId)) {
                                        throw {code: 404, message: "Ingredient not found"};
                                    }
                                } else {
                                    throw {code: 400, message: "Option ingredientId is required"};
                                }

                                const newOption = await existingOptionGroup.createOption({
                                    ingredientId: item.ingredientId,
                                    priceAdjustment: item.priceAdjustment,
                                    multipleChoice: item.multipleChoice,
                                    minQuantity: item.minQuantity,
                                    maxQuantity: item.maxQuantity
                                });

                                await newOption.setIngredient(item.ingredientId);
                            }
                        }
                    }
                }
            }
        }

        // Send response
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
    try {
        const productId = req.params.id != undefined ? Number(req.params.id) : undefined;
        const productIdCheck = req.body.id;

        // Check if the product ID is valid
        if (productId != undefined || productIdCheck != undefined) {
            if (typeof productId !== "number" || typeof productIdCheck !== "number") {
                throw {code: 400, message: "Product ID must be a number"};
            }
            if (productId <= 0 && productIdCheck <= 0) {
                throw {code: 400, message: "Invalid product ID"};
            }
            if (productId != productIdCheck) {
                throw {code: 400, message: "Product ID mismatch"};
            }

            // Check if the product exists
            const foundProduct = await db.products.findOne({ where: { id: productId } });
            if (!foundProduct) {
                throw {code: 404, message: "Product not found"};
            }
        } else {
            throw {code: 400, message: "Product ID is required"};
        }

        // Delete the product
        await db.products.destroy({ where: { id: productId } });

        // Send response
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
        const category = await checkCategoryId(categoryId);


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
            message: "Category added successfully"
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to add category");
    }
}

// DELETE: /:id/categories
async function removeCategory(req, res) {
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
            message: "Category removed successfully"
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
            throw {code: 409, message: "OptionGroup already linked to product"};
        }

        // Add the optionGroup to the product
        await product.addOptionGroup(optionGroup);

        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            message: "OptionGroup added successfully"
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to add optionGroup");
    }
}

// DELETE: /:id/optionGroups
async function removeOption(req, res) {
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
            message: "OptionGroup removed successfully"
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
            message: "Ingredient added successfully"
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
        } else if (measurement != undefined) {
            if (typeof measurement !== "string") {
                throw {code: 400, message: "Ingredient measurement must be a string"};
            }
            if (measurement.trim() === "") {
                throw {code: 400, message: "Ingredient measurement must not be empty"};
            }
        } else {
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
            throw {code: 404, message: "Ingredient is not linked to product"};
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
            message: "Ingredient updated successfully"
        });
    } catch (error) {
        // Handle errors
        return sendError(res, error, "Failed to update ingredient");
    }
}

// DELETE: /:id/ingredients
async function removeIngredient(req, res) {
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
        const ingredient = await checkIngredientId(req.body.id);


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
    deleteProduct
}