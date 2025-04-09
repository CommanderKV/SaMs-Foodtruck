import db from '../models/index.js';
import sendError from '../tools/errorHandling.js';
import stripe from "stripe"
import { v4 as uuidv4, validate } from 'uuid';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkOrderId(id) {
    // Check if the id is undefined
    if (id === undefined) {
        throw { code: 400, message: "Order ID required" };
    }

    // Check if the id is a valid number
    if (isNaN(id)) {
        throw { code: 400, message: "Order ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Order ID must be greater than 0" };
    }

    // Check if the order exists in the database
    const order = await db.orders.findByPk(id);
    if (order === null) {
        throw { code: 404, message: "Order not found" };
    }

    // Return the order
    return order;
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
    
    // Check to make sure the cart exists
    const cart = await db.carts.findByPk(id);
    if (cart === null) {
        throw { code: 404, message: "Cart not found" };
    }

    return cart;
}

async function checkOrderDetails(details, optional=false) {
    // Check to make sure the details are not null
    if (details === undefined) {
        throw { code: 400, message: "Order details required" };
    }

    // Create the details object
    let orderDetails = {};

    // Check cartId
    if (!optional) {
        orderDetails.cart = await checkCartId(details.cartId);
    }

    // Check if the firstName is null
    if (details.firstName !== undefined) {
        // Check if the firstName is a string
        if (typeof details.firstName !== "string") {
            throw { code: 400, message: "First name must be a string" };
        } else if (details.firstName.length < 2) {
            throw { code: 400, message: "First name must be at least 2 characters long" };
        }

        orderDetails.firstName = details.firstName;
    } else if (!optional) {
        throw { code: 400, message: "First name required" };
    }

    // Check if the lastName is null
    if (details.lastName !== undefined) {
        // Check if the lastName is a string
        if (typeof details.lastName !== "string") {
            throw { code: 400, message: "Last name must be a string" };
        } else if (details.lastName.length < 2) {
            throw { code: 400, message: "Last name must be at least 2 characters long" };
        }

        orderDetails.lastName = details.lastName;
    } else if (!optional) {
        throw { code: 400, message: "Last name required" };
    }

    // Check if the email is null
    if (details.email !== undefined) {
        // Check if the email is string
        if (typeof details.email !== "string") {
            throw { code: 400, message: "Email must be a string" };
        }

        // Check if the email is valid using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(details.email)) {
            throw { code: 400, message: "Email must be valid" };
        }

        orderDetails.email = details.email;
    }

    // Check if the phoneNumber is null
    if (details.phoneNumber !== undefined) {
        // Check if the phoneNumber is a string
        if (typeof details.phoneNumber !== "string") {
            throw { code: 400, message: "Phone number must be a string" };
        }

        // Check if the phoneNumber is valid using regex
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(details.phoneNumber)) {
            throw { code: 400, message: "Phone number must be valid" };
        }

        orderDetails.phoneNumber = details.phoneNumber;
    }

    // Check if both the email and the phoneNumber are null
    if (!optional) {
        if (orderDetails.email === undefined && orderDetails.phoneNumber === undefined) {
            throw { code: 400, message: "Email or phone number is required" };
        }
    }

    // Check if the there are details to update
    if (optional) {
        if (Object.keys(orderDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return orderDetails;
}

function createLineItems(cartProducts) {
    // Create the line items for Stripe
    let lineItems = [];

    // Go through each productOrder
    for (let i = 0; i < cartProducts.length; i++) {
        // Get the productOrder's product
        const productOrder = cartProducts[i];
        const product = productOrder.getProduct();

        // Push to line items
        lineItems.push({
            price_data: {
                currency: "cad",
                product_data: {
                    name: product.name,
                    description: product.description,
                    images: [product.imageUrl],
                },
                unit_amount: productOrder.price * 100, // Price in cents
            },
            quantity: productOrder.quantity,
            // Tax rates can be applied here
        });
    }

    return lineItems;
}

////////////////////
//    Requests    //
////////////////////

// GET: /:id
async function getOrderById(req, res) {
    /**
     * Body: null
     */
    try {
        //////////////////////////
        //  Run check on input  //
        //////////////////////////
        const order = await checkOrderId(req.params.id);

        
        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get the order with the products and product Orders
        const orderDetails = await db.orders.findByPk(order.id, {
            include: [
                {
                    model: db.productOrders,
                    as: "productOrders",
                    attributes: ["id", "price", "quantity"],
                    include: [
                        {
                            model: db.products,
                            as: "product",
                            attributes: ["id", "name"],
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: orderDetails
        });
    } catch (error) {
        sendError(res, error, "Failed to fetch order");
    }
}

// POST: /create
async function createOrder(req, res) {
    /**
     * Body: {
     *      cartId: number,
     *      firstName: string,
     *      lastName: string,
     *      email: string,
     *      phoneNumber: string,
     *  }
     */
    try {
        ///////////////////////////////
        //  Preform checks on input  //
        ///////////////////////////////
        const orderDetails = checkOrderDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        
        // Get the cart from the order details
        const cart = orderDetails.cart;

        // Update the order details
        orderDetails.orderStatus = "unPaid";
        orderDetails.userId = cart.userId;

        // Move the order to the session
        req.session.order = orderDetails;

        // Get the user
        const user = await db.users.findByPk(orderDetails.userId);
        if (user === null) {
            throw { code: 404, message: "User not found" };
        }

        // Get the cart products
        const cartProducts = await cart.getProductOrders();

        // Check if the cart is empty
        if (cartProducts.length === 0) {
            throw { code: 400, message: "Cart is empty" };
        }

        // Create a custom uuid for the order
        orderDetails.id = uuidv4();

        // Create the items for stripe
        const lineItems = createLineItems(cartProducts);

        // Perform the payment using Stripe
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripeClient.checkout.sessions.create({
            customer_email: orderDetails.email || user.email || null,
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.SERVER_URL}/api/v1/orders/orderSuccess/${orderDetails.id}`,
            cancel_url: `${process.env.SERVER_URL}/api/v1/orders/orderCancel/${orderDetails.id}`,
        });


        //////////////////////
        //  Send a message  //
        //////////////////////
        res.redirect(303, session.url);
    } catch (error) {
        sendError(res, error, "Failed to create order");
    }
}

// PUT: /update/:id
async function updateOrder(req, res) {
    /**
     * Body: {
     *      firstName: string,
     *      lastName: string,
     *      email: string,
     *      phoneNumber: string,
     *  }
     */
    try {
        ///////////////////////////////
        //  Preform checks on input  //
        ///////////////////////////////
        const order = await checkOrderId(req.params.id);
        const orderDetails = checkOrderDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Update the order
        await order.update(orderDetails);


        //////////////////////
        //  Send a message  //
        //////////////////////
        res.status(201).json({
            status: "success", 
            data: {
                message: "Order updated"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to update order");
    }
}

// DELETE: /delete/:id
async function deleteOrder(req, res) {
    /**
     * Body: null
     */
    try {
        //////////////////////////
        //  Run check on input  //
        //////////////////////////
        const order = await checkOrderId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await order.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Order deleted"
            }
        });
    } catch (error) {
        sendError(res, error, "Failed to delete order");
    }
}

// GET: /orderSuccess/:id
async function orderSuccess(req, res) {
    /**
     * Body: null
     */
    try {
        //////////////////////////
        //  Run check on input  //
        //////////////////////////
        // Check if the id is a UUID
        if (!validate(req.params.id)) {
            throw { code: 400, message: "Order ID must be a valid UUID" };
        
        // Check if the id is correct
        } else if (req.params.id !== req.session.order.id) {
            throw { code: 400, message: "Order ID does not match" };
        }

        // Get the order details
        const orderDetails = req.session.order;

        /////////////////////
        //  Perform logic  //
        /////////////////////

        // Get the cart
        const cart = orderDetails.cart;
        delete orderDetails.cart;

        // Get the cart products
        const cartProducts = await cart.getProductOrders();
        if (cartProducts.length === 0) {
            throw { code: 400, message: "Cart is empty" };
        }

        // Update the order status
        orderDetails.orderStatus = "Paid";

        // Create the order
        const order = await db.orders.create(orderDetails);

        // Add the productOrders to the order
        await order.setProductOrders(cartProducts);

        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.redirect(303, `${process.env.CLIENT_URL}/orderSuccess/${order.id}`);
    } catch {error} {
        sendError(res, error, "Failed to update order");
    }
}

// GET: /orderCancel/:id
async function orderCancel(req, res) {
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////

        // Check if the id is a UUID
        if (!validate(req.params.id)) {
            throw { code: 400, message: "Order ID must be a valid UUID" };
        
        // Check if the id is correct
        } else if (req.params.id !== req.session.order.id) {
            throw { code: 400, message: "Order ID does not match" };
        }


        /////////////////////
        //  Perform logic  //
        /////////////////////
        delete req.session.order;


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.redirect(303, `${process.env.CLIENT_URL}/orderCancel`);
    } catch (error) {
        sendError(res, error, "Failed to cancel order");
    }
}

export default {
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    orderSuccess,
    orderCancel,
};
