import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";
import fs from "fs";

describe("Ingredient Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Remove all ingredients
        await db.ingredients.findAll().then((ingredient) => {
            ingredient.forEach(async (ingredient) => {
                await ingredient.destroy();
            });
        });

        // Create testing data
        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "This is a test ingredient",
            quantity: 10,
            photo: "test.jpg",
            productLink: "http://test.com",
            price: 1.99
        });
        testingData.ingredient2 = await db.ingredients.create({
            name: "Test Ingredient2",
            description: "This is a test ingredient",
            quantity: 10,
            photo: "test.jpg",
            productLink: "http://test.com",
            price: 4.99
        });

        // Get the test image
        const image = fs.readFileSync("./public/imgs/github.png");
        testingData.encodedImage = `data:image/png;base64,${image.toString("base64")}`;
    });

    describe("GET /", () => {
        it("Should return all ingredients", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/ingredients");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(2);
        });
    });

    describe("GET /:id", () => {
        it("Should return an ingredient by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/${testingData.ingredient.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.ingredient.id);
        });

        it("Should return an error for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/${testingData.ingredient.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("Should return an error for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid ingredient ID");
        });
    });

    describe("POST /create", () => {
        it("Should create a new ingredient", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.name).toBe("New Ingredient");

            // Remove the photos
            fs.unlinkSync(`./public/imgs/${response.body.data.photo}`);
        });

        it("Should return an error for missing name", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });
        
        it("Should return an error for missing description", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description required");
        });
        
        it("Should return an error for missing quantity", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity required");
        });
        
        it("Should return an error for missing photo", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo required");
        });
        
        it("Should return an error for missing product link", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product link required");
        });
        
        it("Should return an error for missing price", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price required");
        });
    });

    describe("PUT /update/:id", () => {
        it("Should update an ingredient", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id,
                    name: "Updated Ingredient",
                    description: "This is an updated ingredient",
                    quantity: 20,
                    photo: testingData.encodedImage,
                    productLink: "http://updated.com",
                    price: 3.99,
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Ingredient updated");

            // Check the ingredient
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient.name).toBe("Updated Ingredient");
            expect(ingredient.description).toBe("This is an updated ingredient");
            expect(ingredient.quantity).toBe(20);
            expect(ingredient.photo != "test.jpg").toBeTruthy();
            expect(ingredient.productLink).toBe("http://updated.com");
            expect(ingredient.price).toBe(3.99);

            // Remove the photo
            fs.unlinkSync(`./public/imgs/${ingredient.photo}`);
        });

        it("Should update an ingredient's quantity", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: 20
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Ingredient updated");

            // Check the ingredient
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient.quantity).toBe(20);
        });

        it("Should update an ingredient's photo", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id,
                    photo: testingData.encodedImage
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Ingredient updated");

            // Check the ingredient
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient.photo).toBeDefined();

            // Remove the photos
            fs.unlinkSync(`./public/imgs/${ingredient.photo}`);
        });
        
        it("Should return an error for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id+10}`)
                .send({
                    id: testingData.ingredient.id+10
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("Should return an error for mis-matching IDs", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id+1
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID mismatch");
        });
        
        it("Should return an error for no ID given", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/`)
                .send({});
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID required");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("Should delete an ingredient", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id
                });
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBe("Ingredient deleted");

            // Check that ingredient was deleted
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient).toBeNull();
        });

        it("Should return an error for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/${testingData.ingredient.id + 30}`)
                .send({
                    id: testingData.ingredient.id + 30
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("Should return an error for mis-matching IDs", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/${testingData.ingredient.id}`)
                .send({
                    id: testingData.ingredient.id+1
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID mismatch");
        });
        
        it("Should return an error for no ID given", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/`)
                .send({});
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID required");
        });
    });
});