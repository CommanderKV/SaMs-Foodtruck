import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("OptionGroup Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Create testing data for products first (required for optionGroups)
        testingData.product = await db.products.create({
            name: "Test Product",
            description: "Test product description",
            photo: "test.jpg",
            price: 9.99,
        });
        
        // Create testing data for optionGroups
        testingData.optionGroup = await db.optionGroups.create({
            sectionName: "Test OptionGroup",
            multipleChoice: true,
            productId: testingData.product.id
        });
        testingData.optionGroup2 = await db.optionGroups.create({
            sectionName: "Test OptionGroup2",
            multipleChoice: false,
            productId: testingData.product.id
        });
        
        // Create test ingredients and options for relationship testing
        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "Test ingredient description",
            quantity: 100,
            photo: "test.jpg",
            productLink: "http://test.com",
            price: 1.99,
        });
        
        testingData.option = await db.options.create({
            priceAdjustment: 0.50,
            defaultQuantity: 1,
            minQuantity: 0,
            maxQuantity: 3,
            ingredientId: testingData.ingredient.id
        });
    });

    afterEach(async () => {
        // Remove all test data
        await db.options.destroy({ where: {} });
        await db.optionGroups.destroy({ where: {} });
        await db.products.destroy({ where: {} });
        await db.ingredients.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all optionGroups", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/optionGroups");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(2);
        });

        it("should return an empty array if no optionGroups exist", async () => {
            // Clear the optionGroups table
            await db.optionGroups.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/optionGroups');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("should return an optionGroup by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/optionGroups/${testingData.optionGroup.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.optionGroup.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/optionGroups/${testingData.optionGroup.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 400 for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/optionGroups/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be greater than 0");
        });

        it("should return 400 if the optionGroup ID is not a number", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/optionGroups/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be a number");
        });
    });

    describe("POST /create", () => {
        it("should create a new optionGroup", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    sectionName: "New OptionGroup",
                    multipleChoice: true,
                    productId: testingData.product.id
                });
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.sectionName).toBe("New OptionGroup");
        });

        it("should return 400 for missing sectionName", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    multipleChoice: true,
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Section name required");
        });

        it("should return 400 if sectionName is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    sectionName: 123,
                    multipleChoice: true,
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Section name must be a string");
        });

        it("should return 400 if sectionName is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    sectionName: "",
                    multipleChoice: true,
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Section name must not be empty");
        });

        it("should return 400 if multipleChoice is not a boolean", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    sectionName: "New OptionGroup",
                    multipleChoice: "yes",
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Multiple choice flag must be a boolean");
        });

        it("should return 400 if multipleChoice is missing", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/optionGroups/create")
                .send({
                    sectionName: "New OptionGroup",
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Multiple choice flag required");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update an optionGroup", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/${testingData.optionGroup.id}`)
                .send({
                    sectionName: "Updated OptionGroup",
                    multipleChoice: false
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("OptionGroup updated successfully");

            // Check the optionGroup
            const optionGroup = await db.optionGroups.findByPk(testingData.optionGroup.id);
            expect(optionGroup.sectionName).toBe("Updated OptionGroup");
            expect(optionGroup.multipleChoice).toBe(false);
        });

        it("should update an optionGroup's sectionName only", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/${testingData.optionGroup.id}`)
                .send({
                    sectionName: "Updated OptionGroup"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("OptionGroup updated successfully");

            // Check the optionGroup
            const optionGroup = await db.optionGroups.findByPk(testingData.optionGroup.id);
            expect(optionGroup.sectionName).toBe("Updated OptionGroup");
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/${testingData.optionGroup.id+10}`)
                .send({
                    sectionName: "Updated OptionGroup"
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 400 if the optionGroup ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/not-a-number`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be a number");
        });

        it("should return 400 if the optionGroup ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/-1`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be greater than 0");
        });

        it("should return 200 if there are no details to update", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/optionGroups/update/${testingData.optionGroup.id}`)
                .send();

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("No details to update");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete an optionGroup", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/delete/${testingData.optionGroup.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("OptionGroup deleted successfully");

            // Check that optionGroup was deleted
            const optionGroup = await db.optionGroups.findByPk(testingData.optionGroup.id);
            expect(optionGroup).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/delete/${testingData.optionGroup.id + 30}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 400 if the optionGroup ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/delete/not-a-number`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be a number");
        });

        it("should return 400 if the optionGroup ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/delete/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be greater than 0");
        });
    });

    describe("GET /:id/options", () => {
        it("should return all options in an optionGroup", async () => {
            // Add option to optionGroup first
            await testingData.optionGroup.addOption(testingData.option);
            
            // Send request
            const response = await request(app)
                .get(`/api/v1/optionGroups/${testingData.optionGroup.id}/options`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe(testingData.option.id);
        });

        it("should return an empty array if no options in optionGroup", async () => {
            // Send request
            const response = await request(app)
                .get(`/api/v1/optionGroups/${testingData.optionGroup.id}/options`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(0);
        });
    });

    describe("POST /:id/options", () => {
        it("should add an option to an optionGroup", async () => {
            // Send request
            const response = await request(app)
                .post(`/api/v1/optionGroups/${testingData.optionGroup.id}/options`)
                .send({
                    optionId: testingData.option.id
                });
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Option added to option group successfully");
            
            // Check that option was added
            const options = await testingData.optionGroup.getOptions();
            expect(options.length).toBe(1);
            expect(options[0].id).toBe(testingData.option.id);
        });

        it("should return 404 if optionGroup not found", async () => {
            // Send request
            const response = await request(app)
                .post(`/api/v1/optionGroups/${testingData.optionGroup.id + 30}/options`)
                .send({
                    optionId: testingData.option.id
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 404 if option not found", async () => {
            // Send request
            const response = await request(app)
                .post(`/api/v1/optionGroups/${testingData.optionGroup.id}/options`)
                .send({
                    optionId: testingData.option.id + 30
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });
    });

    describe("DELETE /:id/options/:optionId", () => {
        it("should remove an option from an optionGroup", async () => {
            // Add option to optionGroup first
            await testingData.optionGroup.addOption(testingData.option);
            
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/${testingData.optionGroup.id}/options/${testingData.option.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Option removed from option group successfully");
            
            // Check that option was removed
            const options = await testingData.optionGroup.getOptions();
            expect(options.length).toBe(0);
        });

        it("should return 404 if optionGroup not found", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/${testingData.optionGroup.id + 30}/options/${testingData.option.id}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 404 if option not found", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/optionGroups/${testingData.optionGroup.id}/options/${testingData.option.id + 30}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });
    });
});
