import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("Option Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Create ingredient for testing
        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "Test ingredient description",
            quantity: 100,
            photo: "default.jpg",
            productLink: "https://www.example.com",
            price: 10.00
        });
        
        // Create testing data
        testingData.option = await db.options.create({
            priceAdjustment: 5.00,
            defaultQuantity: 1,
            minQuantity: 0,
            maxQuantity: 5,
            ingredientId: testingData.ingredient.id
        });
        testingData.option2 = await db.options.create({
            priceAdjustment: 10.00,
            defaultQuantity: 2,
            minQuantity: 1,
            maxQuantity: 10,
            ingredientId: testingData.ingredient.id
        });
    });

    afterEach(async () => {
        // Remove all options and ingredients
        await db.options.destroy({ where: {} });
        await db.ingredients.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all options", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/options");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(2);
        });

        it("should return an empty array if no options exist", async () => {
            // Clear the options table
            await db.options.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/options');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("should return an option by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/options/${testingData.option.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.option.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/options/${testingData.option.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });

        it("should return 400 for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/options/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be greater than 0");
        });

        it("should return 400 if the option ID is not a number", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/options/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be a number");
        });
    });

    describe("POST /create", () => {
        it("should create a new option", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: 15.00,
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(parseFloat(response.body.data.priceAdjustment)).toBe(15.00);
            expect(response.body.data.defaultQuantity).toBe(3);
        });

        it("should return 400 for missing priceAdjustment", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment required");
        });

        it("should return 400 if priceAdjustment is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: "not-a-number",
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must be a number");
        });

        it("should return 400 if priceAdjustment is negative", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: -5,
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price adjustment must not be negative");
        });

        it("should return 400 for missing defaultQuantity", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: 15.00,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Default quantity required");
        });

        it("should return 400 for missing ingredient ID", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: 15.00,
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID required");
        });

        it("should return 404 for non-existent ingredient ID", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/options/create")
                .send({
                    priceAdjustment: 15.00,
                    defaultQuantity: 3,
                    minQuantity: 1,
                    maxQuantity: 5,
                    ingredientId: 9999
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update an option", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/${testingData.option.id}`)
                .send({
                    priceAdjustment: 20.00,
                    defaultQuantity: 2,
                    minQuantity: 1,
                    maxQuantity: 10
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Check the option
            const option = await db.options.findByPk(testingData.option.id);
            expect(parseFloat(option.priceAdjustment)).toBe(20.00);
            expect(option.defaultQuantity).toBe(2);
        });

        it("should update an option's priceAdjustment only", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/${testingData.option.id}`)
                .send({
                    priceAdjustment: 25.00
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");

            // Check the option
            const option = await db.options.findByPk(testingData.option.id);
            expect(parseFloat(option.priceAdjustment)).toBe(25.00);
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/${testingData.option.id+10}`)
                .send({
                    priceAdjustment: 25.00
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });

        it("should return 400 if the option ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/not-a-number`)
                .send({
                    priceAdjustment: 25.00
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be a number");
        });

        it("should return 400 if the option ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/-1`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be greater than 0");
        });

        it("should return 200 if there are no details to update", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/options/update/${testingData.option.id}`)
                .send({});

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.message).toBe("No details to update");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete an option", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/options/delete/${testingData.option.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Option deleted successfully");

            // Check that option was deleted
            const option = await db.options.findByPk(testingData.option.id);
            expect(option).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/options/delete/${testingData.option.id + 30}`)
                .send();
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });

        it("should return 400 if the option ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/options/delete/not-a-number`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be a number");
        });

        it("should return 400 if the option ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/options/delete/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be greater than 0");
        });
    });
});
