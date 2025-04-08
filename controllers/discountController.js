import db from "../models/index.js";
import sendError from '../tools/errorHandling.js';

/////////////////////////////
//    Utility functions    //
/////////////////////////////

async function checkDiscountId(id) {
    // Make sure id is not undefined
    if (id === undefined) {
        throw { code: 400, message: "Discount ID required" };
    }

    // Make sure id is a number
    if (isNaN(id)) {
        throw { code: 400, message: "Discount ID must be a number" };
    } else if (id <= 0) {
        throw { code: 400, message: "Discount ID must be greater than 0" };
    }

    // Make sure discount exists
    const discount = await db.discounts.findByPk(id);
    if (discount === null) {
        throw { code: 404, message: "Discount not found" };
    }

    return discount;
}

function checkDiscountDetails(details, optional=false) {
    // The details to return
    var discountDetails = {};

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
        discountDetails.name = details.name;
    } else if (!optional) {
        throw { code: 400, message: "Name required" };
    }

    // Check the description
    if (details.description !== undefined) {
        // Make sure the description is a string
        if (typeof details.description !== "string") {
            throw { code: 400, message: "Description must be a string" };
        }
        // Check if the description is empty
        if (details.description === "") {
            throw { code: 400, message: "Description required" };
        }
        discountDetails.description = details.description;
    } else if (!optional) {
        throw { code: 400, message: "Description required" };
    }

    // Check the price adjustment
    if (details.priceAdjustment !== undefined) {
        // Make sure the price adjustment is a number
        if (isNaN(details.priceAdjustment)) {
            throw { code: 400, message: "Price adjustment must be a number" };
        }
        // Check if price adjustment is below 0
        if (details.priceAdjustment <= 0) {
            throw { code: 400, message: "Price adjustment must be greater than 0" };
        }
        discountDetails.priceAdjustment = details.priceAdjustment;
    } else if (!optional) {
        throw { code: 400, message: "Price adjustment required" };
    }

    // Check if its optional if any details are provided
    if (optional) {
        if (Object.keys(discountDetails).length === 0) {
            throw { code: 200, status: "success", message: "No details to update" };
        }
    }

    // Return the details
    return discountDetails;
}



////////////////////
//    Requests    //
////////////////////

// GET: /
async function getAllDiscounts(req, res){
    /**
     * Body: null
     */
    try {
        // No input to check
        /////////////////////
        //  Perform logic  //
        /////////////////////
        const discounts = await db.discounts.findAll();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            message: "Successfully retrieved discounts",
            data: discounts
        });
    } catch (error) {
        return sendError(res, error, "Failed to get discounts");
    }
}

// GET: /:id
async function getDiscountById(req, res){
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const discount = await checkDiscountId(req.params.id);


        // No logic to perform
        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: discount
        });
    } catch (error) {
        return sendError(res, error, "Failed to get discounts");
    }
}

// POST: /create
async function createDiscount(req, res){
    /**
     * Body: {
     *     name: string,
     *     description: string,
     *     priceAdjustment: number
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const discountDetails = checkDiscountDetails(req.body);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        const discount = await db.discounts.create(discountDetails);


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(201).json({
            status: "success",
            data: discount
        });
    } catch (error) {
        return sendError(res, error, "Failed to get discounts");
    }
}

// PUT: /update/:id
async function updateDiscount(req, res){
    /**
     * Body: {
     *     name: string.
     *     description: string,
     *     priceAdjustment: number
     * }
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const discount = await checkDiscountId(req.params.id);
        const discountDetails = checkDiscountDetails(req.body, true);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await db.discounts.update(discountDetails, {
            where: { id: discount.id }
        });


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: discountDetails
        });
    } catch (error) {
        return sendError(res, error, "Failed to get discounts");
    }
}

// DELETE: /delete/:id
async function deleteDiscount(req, res){
    /**
     * Body: null
     */
    try {
        ///////////////////////////
        //  Run checks on input  //
        ///////////////////////////
        const discount = await checkDiscountId(req.params.id);


        /////////////////////
        //  Perform logic  //
        /////////////////////
        await discount.destroy();


        ///////////////////////
        //  Send a response  //
        ///////////////////////
        res.status(200).json({
            status: "success",
            data: {
                message: "Discount deleted"
            }
        });
    } catch (error) {
        return sendError(res, error, "Failed to get discounts");
    }
}



export default {
    getAllDiscounts,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount
}

