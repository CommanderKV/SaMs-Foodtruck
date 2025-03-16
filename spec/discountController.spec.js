import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("Discount Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Create testing data
        testingData.discount = await db.discounts.create({
            name: "Test Discount",
            description: "This is a test discount",
            priceAdjustment: 5.00
        });
        testingData.discount2 = await db.discounts.create({
            name: "Test Discount2",
            description: "This is another test discount",
            priceAdjustment: 10.00
        });
    });

    afterEach(async () => {
        // Remove all discounts
        await db.discounts.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all discounts", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/discounts");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.message).toBe("Successfully retrieved discounts");
            expect(response.body.data.length).toBe(2);
        });

        it("should return an empty array if no discounts exist", async () => {
            // Clear the discounts table
            await db.discounts.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/discounts');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("should return a discount by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/discounts/${testingData.discount.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.discount.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/discounts/${testingData.discount.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount not found");
        });

        it("should return 400 for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/discounts/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be greater than 0");
        });

        it("should return 400 if the discount ID is not a number", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/discounts/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be a number");
        });
    });

    describe("POST /create", () => {
        it("should create a new discount", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "This is a new discount",
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.name).toBe("New Discount");
            expect(parseFloat(response.body.data.priceAdjustment)).toBe(15.00);
        });

        it("should return 400 for missing name", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    description: "This is a new discount",
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });

        it("should return 400 if name is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: 123,
                    description: "This is a new discount",
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name must be a string");
        });

        it("should return 400 if name is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "",
                    description: "This is a new discount",
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });

        it("should return 400 if description is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: 123,
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description must be a string");
        });

        it("should return 400 if description is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "",
                    priceAdjustment: 15.00
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description required");
        });

        it("should return 400 if priceAdjustment is missing", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "This is a new discount"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment required");
        });

        it("should return 400 if priceAdjustment is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "This is a new discount",
                    priceAdjustment: "not-a-number"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must be a number");
        });

        it("should return 400 if priceAdjustment is not greater than 0", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "This is a new discount",
                    priceAdjustment: 0
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must be greater than 0");
        });

        it("should return 400 if priceAdjustment is negative", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/discounts/create")
                .send({
                    name: "New Discount",
                    description: "This is a new discount",
                    priceAdjustment: -5
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must be greater than 0");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update a discount", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/${testingData.discount.id}`)
                .send({
                    name: "Updated Discount",
                    description: "This is an updated discount",
                    priceAdjustment: 20.00
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Check the discount
            const discount = await db.discounts.findByPk(testingData.discount.id);
            expect(discount.name).toBe("Updated Discount");
            expect(discount.description).toBe("This is an updated discount");
            expect(parseFloat(discount.priceAdjustment)).toBe(20.00);
        });

        it("should update a discount's name only", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/${testingData.discount.id}`)
                .send({
                    name: "Updated Discount"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");

            // Check the discount
            const discount = await db.discounts.findByPk(testingData.discount.id);
            expect(discount.name).toBe("Updated Discount");
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/${testingData.discount.id+10}`)
                .send({
                    name: "Updated Discount"
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount not found");
        });

        it("should return 400 if the discount ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/not-a-number`)
                .send({
                    name: "Updated Discount"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be a number");
        });

        it("should return 400 if the discount ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/-1`)
                .send({
                    name: "Updated Discount"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be greater than 0");
        });

        it("should return 400 if there are no details to update", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/${testingData.discount.id}`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("No details provided");
        });

        it("should return 400 if priceAdjustment is not greater than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/discounts/update/${testingData.discount.id}`)
                .send({
                    priceAdjustment: 0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must be greater than 0");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete a discount", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/discounts/delete/${testingData.discount.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Discount deleted");

            // Check that discount was deleted
            const discount = await db.discounts.findByPk(testingData.discount.id);
            expect(discount).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/discounts/delete/${testingData.discount.id + 30}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount not found");
        });

        it("should return 400 if the discount ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/discounts/delete/not-a-number`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be a number");
        });

        it("should return 400 if the discount ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/discounts/delete/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Discount ID must be greater than 0");
        });
    });
});
