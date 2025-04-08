import db from '../models/index.js';
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkProductOrderId(id) {
    // Check to make sure the id is not null
    if (id === undefined) {
        throw { code: 400, message: "ProductOrder ID required" };
    }

    // Check to make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "ProductOrder ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "ProductOrder ID must be greater than 0" };
    }

    // Check to make sure the productOrder exists
    const product = await db.productOrders.findByPk(id);
    if (product === null) {
        throw { code: 404, message: "ProductOrder not found" };
    }

    return product;
}

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

async function checkProductOrderDetails(details, optional=false) {
    // The details to return
    var productOrderDetails = {};

    // Check the price
    if (details.price !== undefined) {
        // Make sure the price is a number
        if (isNaN(details.price)) {
            throw { code: 400, message: "Price must be a number" };
        }

        // Make sure the price is greater than 0
        if (details.price <= 0) {
            throw { code: 400, message: "Price must be greater than 0" };
        }

        productOrderDetails.price = details.price;
    } else if (!optional) {
        throw { code: 400, message: "Price required" };
    }

    // Check the quantity
    if (details.quantity !== undefined) {
        // Make sure the quantity is a number
        if (isNaN(details.quantity)) {
            throw { code: 400, message: "Quantity must be a number" };
        }

        if (details.quantity <= 0) {
            throw { code: 400, message: "Quantity must be greater than 0" };
        }

        productOrderDetails.quantity = details.quantity;
    } else if (!optional) {
        throw { code: 400, message: "Quantity required" };
    }

    // Check the productId
    if (details.productId !== undefined) {
        // Make sure the productId is a number
        if (isNaN(details.productId)) {
            throw { code: 400, message: "Product ID must be a number" };
        }
        else if (details.productId <= 0) {
            throw { code: 400, message: "Product ID must be greater than 0" };
        }

        // Check to make sure the product exists
        const product = await db.products.findByPk(details.productId);
        if (product === null) {
            throw { code: 404, message: "Product not found" };
        }


        productOrderDetails.productId = details.productId;
    } else if (!optional) {
        throw { code: 400, message: "Product ID required" };
    }

    // Check if the details are optional
    if (optional) {
        if (Object.keys(productOrderDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return productOrderDetails;
}

////////////////////
//    Requests    //
////////////////////

// GET: /:id
async function getProductOrderById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        await checkProductOrderId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get the product order with the products
        const productOrder = await db.productOrders.findByPk(req.params.id, {
            attributes: ["id", "quantity", "price"],
            include: [
                {
                    model: db.customizations,
                    as: "customizations",
                    attributes: ["id", "quantity", "price"],
                    include: [
                        {
                            model: db.ingredients,
                            as: "ingredient",
                            attributes: ["id", "name"]
                        }
                    ]
                },
                {
                    model: db.products,
                    as: "product",
                    attributes: ["id", "name", "description", "price"],
                }
            ],
            raw: true,
            nest: true,
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: productOrder
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch product order");
    }
}

// POST: /create
async function createProductOrder(req, res) {
    /**
     * Body: {
     *    quantity: int,
     *    price: float,
     *    productId: int,
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const productOrderDetails = await checkProductOrderDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Create the product order
        const productOrder = await db.productOrders.create(productOrderDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: productOrder
        });
    } catch (error) {
        sendError(res, error, "Failed to create product order");
    }
}

// PUT: /update/:id
async function updateProductOrder(req, res) {
    /**
     * Body: {
     *    quantity: int,
     *    price: float,
     *    productId: int
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const productOrder = await checkProductOrderId(req.params.id);
        const productOrderDetails = await checkProductOrderDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        
        // Update the product order
        await productOrder.update(productOrderDetails);

        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Product order updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update product order");
    }
}

// DELETE: /delete/:id
async function deleteProductOrder(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const productOrder = await checkProductOrderId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Delete the product order
        await productOrder.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Product order deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete product order");
    }
}


// POST: /:id/customizations
async function addCustomizationToProductOrder(req, res) {
    /**
     * Body: {
     *    customizationId: int,
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const productOrder = await checkProductOrderId(req.params.id);
        const customization = await checkCustomizationId(req.body.customizationId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the customization is already linked to the product order
        const check = await productOrder.getCustomizations({
            where: {
                id: customization.id
            }
        });
        if (check.length > 0) {
            throw {code: 409, message: "Customization already linked to product order"};
        }

        // Add the customization to the product order
        await productOrder.addCustomization(customization.id);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: customization
        });
    } catch (error) {
        sendError(res, error, "Failed to add customization to product order");
    }
}

// DELETE: /:id/customizations/:customizationId
async function removeCustomizationFromProductOrder(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const productOrder = await checkProductOrderId(req.params.id);
        const customization = await checkCustomizationId(req.params.customizationId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the customization is linked to the product order
        const check = await productOrder.getCustomizations({
            where: {
                id: customization.id
            }
        });

        // There are no customizations linked to the product order
        if (check.length === 0) {
            throw {code: 409, message: "Customization not linked to product order"};
        
        // Remove the customization from the product order
        } else {
            await productOrder.removeCustomization(customization.id);
        }


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Customization removed from product order"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to remove customization from product order");
    }
}

export default {
    getProductOrderById,
    createProductOrder,
    updateProductOrder,
    deleteProductOrder,
    addCustomizationToProductOrder,
    removeCustomizationFromProductOrder,
};
