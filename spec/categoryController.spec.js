import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("Category Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
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

    afterEach(async () => {
        // Remove all categories
        await db.categories.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all categories", async () => {
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
        it("should return a category by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/${testingData.category.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.category.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/${testingData.category.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("should return 400 for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/categories/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be greater than 0");
        });

        it("should return 400 if the category ID is not a number", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/categories/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be a number");
        });
    });

    describe("POST /create", () => {
        it("should create a new category", async () => {
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

        it("should return 400 for missing name", async () => {
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

        it("should return 400 if name is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    name: 123,
                    description: "This is a new category"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name must be a string");
        });

        it("should return 400 if name is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    name: "",
                    description: "This is a new category"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });

        it("should return 400 if description is not a string", async () => {
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

        it("should return 400 if description is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/categories/create")
                .send({
                    name: "New Category",
                    description: ""
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description empty");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update a category", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send({
                    name: "Updated Category",
                    description: "This is an updated category"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Category updated");

            // Check the category
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category.name).toBe("Updated Category");
            expect(category.description).toBe("This is an updated category");
        });

        it("should update a category's name", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send({
                    name: "Updated Category"
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Category updated");

            // Check the category
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category.name).toBe("Updated Category");
        });

        it("should return 404 for invalid ID", async () => {
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

        it("should return 400 if the category ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/not-a-number`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be a number");
        });

        it("should return 400 if the category ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/-1`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be greater than 0");
        });

        it("should return 200 if there are no details to update", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/categories/update/${testingData.category.id}`)
                .send();

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.message).toBe("No details to update");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete a category", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id}`)
                .send({
                    id: testingData.category.id
                });
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Category deleted");

            // Check that category was deleted
            const category = await db.categories.findByPk(testingData.category.id);
            expect(category).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/${testingData.category.id + 30}`)
                .send();
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("should return 400 if the category ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/categories/delete/not-a-number`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be a number");
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
            expect(response.body.message).toBe("Category ID must be greater than 0");
        });
    });
});
