import request from 'supertest';
import { app } from '../app.js';
import db from '../models/index.js';

describe("Customization Controller", () => {
    // Define testing data
    let testingData = {};

    beforeEach(async () => {
        // Create testing data
        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "Test Ingredient Description",
            quantity: 10,
            price: 1.0,
            photo: "/public/imgs/github.png",
            productLink: "http://example.com",
        });

        testingData.customization = await db.customizations.create({
            quantity: 2,
            price: 5.99,
            ingredientId: testingData.ingredient.id
        });
    });

    afterEach(async () => {
        // Remove all data
        await db.customizations.destroy({ where: {} });
        await db.ingredients.destroy({ where: {} });
    });

    describe("GET /:id", () => {
        it("should return a customization by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/customizations/${testingData.customization.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.customization.id);
        });

        it("should return 404 if customization is not found", async () => {
            // Send a request
            const response = await request(app).get(`/api/v1/customizations/9999`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 400 if ID is invalid", async () => {
            // Send a request
            const response = await request(app).get(`/api/v1/customizations/invalid`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be a number");
        });

        it("should return 400 if ID is negative", async () => {
            // Send a request
            const response = await request(app).get(`/api/v1/customizations/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be greater than 0");
        });
    });


    describe("POST /create", () => {
        it("should create a new customization", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 10.99,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.quantity).toBe(3);
        });

        it("should return 400 if quantity is missing", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    price: 10.99,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity is required");
        });

        it("should return 400 if price is not provided", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price is required");
        });

        it("should return 400 if ingredientId is not provided", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 10.99
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID is required");
        });

        it("should return 404 if ingredient is not found", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 10.99,
                    ingredientId: 9999
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if price is negative", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: -10.99,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be greater than 0");
        });

        it("should return 400 if quantity is negative", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: -3,
                    price: 10.99,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be greater than 0");
        });

        it("should return 400 if ingredientId is negative", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 10.99,
                    ingredientId: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });

        it("should return 400 if ingredientId is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 10.99,
                    ingredientId: "invalid"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if price is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: "invalid",
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a number");
        });

        it("should return 400 if quantity is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: "invalid",
                    price: 10.99,
                    ingredientId: testingData.ingredient.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be a number");
        });

        it("should return 400 if quantity is zero", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 0,
                    price: 10.99,
                    ingredientId: testingData.ingredient.id
                });
                
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be greater than 0");
        });

        it("should return 400 if price is zero", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/customizations/create`)
                .send({
                    quantity: 3,
                    price: 0,
                    ingredientId: testingData.ingredient.id
                });
        
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be greater than 0");
        });
    });


    describe("PUT /update/:id", () => {
        it("should update an existing customization", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Customization updated");

            // Check the customization
            const updatedCustomization = await db.customizations.findByPk(testingData.customization.id);
            expect(updatedCustomization.quantity).toBe(5);
        });

        it("should return 200 if no details to update", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({});


            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("No details to update");
        });

        it("should return 200 and ignore invalid fields in the request body", async () => {
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    invalidField: "invalidValue"
                });
        
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("No details to update");
        });

        it("should return 404 if customization is not found", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/9999`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 400 if quantity is invalid", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    quantity: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be greater than 0");
        });

        it("should return 400 if price is invalid", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    price: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be greater than 0");
        });

        it("should return 400 if ingredientId is invalid", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    ingredientId: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });

        it("should return 400 if ID is negative", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/-1`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be greater than 0");
        });

        it("should return 400 if ID is not a number", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/invalid`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be a number");
        });

        it("should return 404 if ingredient is not found", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    ingredientId: 9999
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if ingredientId is not a number", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    ingredientId: "invalid"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if price is not a number", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    price: "invalid"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a number");
        });

        it("should return 400 if quantity is not a number", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/customizations/update/${testingData.customization.id}`)
                .send({
                    quantity: "invalid"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be a number");
        });
    });


    describe("DELETE /delete/:id", () => {
        it("should delete a customization", async () => {
            // Create a new customization for deletion
            const newCustomization = await db.customizations.create({
                quantity: 1,
                price: 2.99,
                ingredientId: testingData.ingredient.id
            });

            // Send a request
            const response = await request(app).delete(`/api/v1/customizations/delete/${newCustomization.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Customization deleted");
        });

        it("should return 404 when trying to delete an already deleted customization", async () => {
            // Delete the customization
            await request(app)
                .delete(`/api/v1/customizations/delete/${testingData.customization.id}`);
        
            // Attempt to delete again
            const response = await request(app)
                .delete(`/api/v1/customizations/delete/${testingData.customization.id}`);
        
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 404 if customization is not found", async () => {
            // Send a request
            const response = await request(app).delete(`/api/v1/customizations/delete/9999`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 400 if ID is invalid", async () => {
            // Send a request
            const response = await request(app).delete(`/api/v1/customizations/delete/invalid`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be a number");
        });

        it("should return 400 if ID is negative", async () => {
            // Send a request
            const response = await request(app).delete(`/api/v1/customizations/delete/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be greater than 0");
        });
    });
});
