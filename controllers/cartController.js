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

    // Check to make sure the category exists
    const cart = await db.cart.findByPk(id);
    if (cart === null) {
        throw { code: 404, message: "Cart not found" };
    }

    return cart;
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

    // Check the customerId
    if (details.customerId !== undefined) {
        // Make sure the customerId is a string
        if (typeof details.customerId !== "string") {
            throw { code: 400, message: "CustomerId must be a string" };
        }

        if (details.customerId === "") {
            throw { code: 400, message: "CustomerId empty" };
        }

        // Check to see if its in the customers
        const customer = await db.users.findByPk(details.customerId);
        if (customer === null) {
            throw { code: 404, message: "Customer not found" };
        }

        cartDetails.customerId = details.customerId;
    }

    // Check if the details are optional
    if (optional) {
        if (Object.keys(cartDetails).length === 0) {
            throw { code: 400, message: "No details to update" };
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
        const cart = await checkCartId(req.params.id);


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
        return sendError(res, error, "Failed to fetch cart");
    }
}

// POST: /create
async function createCart(req, res) {
    /**
     * Body: {
     *    orderTotal: float,
     *    customerId: string
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

        // Create the category
        const cart = await db.carts.create(cartDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: category
        });
    } catch (error) {
        sendError(res, error, "Failed to create cart");
    }
}

// PUT: /update/:id
async function updateCart(req, res) {
    /**
     * Body: {
     *     orderTotal: string,
     *     customerId: string
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////


        /////////////////////
        //  Perform logic  //
        /////////////////////


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

export default {
    getCartById,
    createCart,
    updateCart,
    deleteCart
};
