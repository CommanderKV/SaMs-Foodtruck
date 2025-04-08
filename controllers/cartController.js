import db from '../models/index.js';
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkCartId(id) {
    // Check to make sure the id is not null
    if (id === undefined) {
        throw { code: 400, message: "Cart ID required" };
    }

    // Check to make sure the id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Cart ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Cart ID must be greater than 0" };
    }
    
    // Check to make sure the cart exists
    const cart = await db.carts.findByPk(id);
    if (cart === null) {
        throw { code: 404, message: "Cart not found" };
    }

    return cart;
}

async function checkProductId(id) {
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

async function checkCartDetails(details, optional=false) {
    // The details to return
    var cartDetails = {};

    // Check the orderTotal
    if (details.orderTotal !== undefined) {
        // Make sure the total is a number
        if (isNaN(details.orderTotal)) {
            throw { code: 400, message: "Order total must be a number" };
        }

        // Make sure the total is greater than 0
        if (details.orderTotal <= 0) {
            throw { code: 400, message: "Order total must be greater than 0" };
        }

        cartDetails.orderTotal = details.orderTotal;
    } else if (!optional) {
        throw { code: 400, message: "Order total required" };
    }

    // Check the userId
    if (details.userId !== undefined) {
        // Make sure the userId is a string
        if (typeof details.userId !== "string") {
            throw { code: 400, message: "UserId must be a string" };
        }

        if (details.userId === "") {
            throw { code: 400, message: "UserId empty" };
        }

        // Check to see if its in the users table
        const user = await db.users.findByPk(details.userId);
        if (user === null) {
            throw { code: 404, message: "User not found" };
        }

        cartDetails.userId = details.userId;
    } else if (!optional) {
        throw { code: 400, message: "UserId required" };
    }

    // Check if the details are optional
    if (optional) {
        if (Object.keys(cartDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return cartDetails;
}

////////////////////
//    Requests    //
////////////////////

// GET: /:id
async function getCartById(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        await checkCartId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get the cart with the products
        const cart = await db.carts.findByPk(req.params.id, {
            include: [
                {
                    model: db.productOrders,
                    as: "productOrders",
                    include: [
                        {
                            model: db.customizations,
                            as: "customizations",
                        }
                    ]
                },
                {
                    model: db.users,
                    as: "user",
                }
            ]
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: cart
        });

    // Catch any database errors
    } catch (error) {
        return sendError(res, error, "Failed to fetch cart");
    }
}

// POST: /create
async function createCart(req, res) {
    /**
     * Body: {
     *    orderTotal: float,
     *    userId: string
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const cartDetails = await checkCartDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Create the cart
        const cart = await db.carts.create(cartDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: cart
        });
    } catch (error) {
        sendError(res, error, "Failed to create cart");
    }
}

// PUT: /update/:id
async function updateCart(req, res) {
    /**
     * Body: {
     *    orderTotal: float,
     *    userId: string
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const cart = await checkCartId(req.params.id);
        const cartDetails = await checkCartDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        
        // Update the cart
        await cart.update(cartDetails);

        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "cart updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update cart");
    }
}

// DELETE: /delete/:id
async function deleteCart(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const cart = await checkCartId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Delete the cart
        await cart.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Cart deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete cart");
    }
}


// POST: /:id/products
async function addProductToCart(req, res) {
    /**
     * Body: {
     *    productOrderId: int,
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const cart = await checkCartId(req.params.id);
        const product = await checkProductId(req.body.productOrderId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Check if the product is already linked to the cart
        const check = await cart.getProductOrders({
            where: {
                id: product.id
            }
        });
        if (check.length > 0) {
            throw {code: 409, message: "Product already linked to cart"};
        }

        // Add the product to the cart
        await cart.addProductOrder(product.id);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: product
        });
    } catch (error) {
        sendError(res, error, "Failed to add product to cart");
    }
}

// DELETE: /:id/products/:productId
async function removeProductFromCart(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const cart = await checkCartId(req.params.id);
        const product = await checkProductId(req.params.productId);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Remove the product from the cart
        await cart.removeProductOrder(product);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Product removed from cart"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to remove product from cart");
    }
}

export default {
    getCartById,
    createCart,
    updateCart,
    deleteCart,
    addProductToCart,
    removeProductFromCart
};
