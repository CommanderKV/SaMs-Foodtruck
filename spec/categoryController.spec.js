import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("Category Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Remove all categories
        await db.categories.findAll().then((category) => {
            category.forEach(async (category) => {
                await category.destroy();
            });
        });

        // Create testing data
        testingData.category = await db.categories.create({
            name: "Test Category",
            description: "This is a test category"
        });
        testingData.category2 = await db.categories.create({
            name: "Test Category2",
            description: "This is another test category"
        });
    });

    describe("GET /", () => {
        it("Should return all categories", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/categories");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(2);
        });

        it("should return an empty array if no categories exist", async () => {
            // Clear the categories table
            await db.categories.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/categories');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("Should return a category by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/${testingData.category.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.category.id);
        });

        it("Should return an error for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/${testingData.category.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("Should return an error for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });

        it("should return 400 if the category ID is not a number", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/categories/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });
    });

    describe("POST /create", () => {
        it("Should create a new category", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    name: "New Category",
                    description: "This is a new category"
                });
            
            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.name).toBe("New Category");
        });

        it("Should return an error for missing name", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    description: "This is a new category"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });

        it("Should return an error for description not being a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    name: "New Category",
                    description: 123
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description must be a string");
        });
    });

    describe("PUT /update/:id", () => {
        it("Should update a category", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send({
                    id: testingData.category.id,
                    name: "Updated Category",
                    description: "This is an updated category"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Category updated");

            // Check the category
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category.name).toBe("Updated Category");
            expect(category.description).toBe("This is an updated category");
        });

        it("Should update a category's name", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send({
                    id: testingData.category.id,
                    name: "Updated Category"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Category updated");

            // Check the category
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category.name).toBe("Updated Category");
        });

        it("Should return an error for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id+10}`)
                .send({
                    id: testingData.category.id+10
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("Should return an error for mis-matching IDs", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send({
                    id: testingData.category.id+1
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID mismatch");
        });
        
        it("Should return an error for no ID given", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/`)
                .send({});
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID required");
        });

        it("should return 400 if the category ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/not-a-number`)
                .send({
                    id: "not-a-number"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });

        it("should return 400 if the category ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/-1`)
                .send({
                    id: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("Should delete a category", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id}`)
                .send({
                    id: testingData.category.id
                });
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Category deleted");

            // Check that category was deleted
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category).toBeNull();
        });

        it("Should return an error for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id + 30}`)
                .send({
                    id: testingData.category.id + 30
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("Should return an error for mis-matching IDs", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id}`)
                .send({
                    id: testingData.category.id+1
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID mismatch");
        });
        
        it("Should return an error for no ID given", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/`)
                .send({});
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID required");
        });

        it("should return 400 if the category ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/not-a-number`)
                .send({
                    id: "not-a-number"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });

        it("should return 400 if the category ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/-1`)
                .send({
                    id: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid category ID");
        });

        it("should return 400 if the category ID is missing in the request body", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id}`)
                .send({});

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID required");
        });
    });
});
