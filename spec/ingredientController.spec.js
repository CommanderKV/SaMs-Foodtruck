import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";
import fs from "fs";

describe("Ingredient Controller", () => {
    // Define testing data
    let testingData = {};

    beforeEach(async () => {
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

    afterEach(async () => {
        // Clean up testing data
        await db.ingredients.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all ingredients", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/ingredients");

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.length).toBe(2);
        });

        it("should return an empty array if no ingredients exist", async () => {
            // Clear the ingredients table
            await db.ingredients.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/ingredients');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("should return an ingredient by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/${testingData.ingredient.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.ingredient.id);
        });

        it("should return 400 for an invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/${testingData.ingredient2.id+10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 for having a negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/ingredients/-1`);
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });

        it("should return 400 if the ingredient ID is not a valid ID", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/ingredients/not-a-number");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });
    });

    describe("POST /create", () => {
        it("should create a new ingredient", async () => {
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
            expect(response.body.data.description).toBe("This is a new ingredient");
            expect(response.body.data.quantity).toBe(10);
            expect(response.body.data.photo).toBeDefined();
            expect(response.body.data.productLink).toBe("http://new.com");
            expect(response.body.data.price).toBe(2.99);

            // Remove the photos
            fs.unlinkSync(`./public/imgs/${response.body.data.photo}`);
        });

        it("should return 400 for missing name", async () => {
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

        it("should return 400 if the name is not a string", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: 123,
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name must be a string");
        });

        it("should return 400 if the name is empty", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });
        
        it("should return 400 for missing description", async () => {
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

        it("should return 400 if the description is not a string", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: 123,
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description must be a string");
        });

        it("should return 400 if the description is empty", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description required");
        });
        
        it("should return 400 for missing quantity", async () => {
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
        
        it("should return 400 if quantity is a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: "not-a-number",
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be a number");
        });

        it("should return 400 if quantity is negative", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: -1,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: 2.99
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity cannot be negative");
        });

        it("should return 400 for missing photo", async () => {
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

        it("should return 400 if photo is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: 123,
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo must be a string");
        });

        it("should return 400 if photo is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: "",
                    productLink: "http://new.com",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo required");
        });
        
        it("should return 400 for missing product link", async () => {
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

        it("should return 400 if product link is not a string", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: 123,
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product link must be a string");
        });

        it("should return 400 if product link is empty", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "",
                    price: 2.99
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product link required");
        });
        
        it("should return 400 for missing price", async () => {
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

        it("should return 400 if price is not a number", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: "not-a-number"
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a number");
        });

        it("should return 400 if price is negative", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/ingredients/create")
                .send({
                    name: "New Ingredient",
                    description: "This is a new ingredient",
                    quantity: 10,
                    photo: testingData.encodedImage,
                    productLink: "http://new.com",
                    price: -1
                });
            
            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price cannot be negative");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update an ingredient", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
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
            expect(response.body.data.message).toBe("Ingredient updated");

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

        it("should update an ingredient's quantity", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    quantity: 20
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Ingredient updated");

            // Check the ingredient
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient.quantity).toBe(20);
        });

        it("should update an ingredient's photo", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    photo: testingData.encodedImage
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Ingredient updated");

            // Check the ingredient
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient.photo).not.toBe(testingData.ingredient.photo);

            // Remove the photos
            fs.unlinkSync(`./public/imgs/${ingredient.photo}`);
        });
        
        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id+10}`)
                .send({});
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });
        
        it("should return 400 if the ingredient ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/not-a-number`)
                .send({});

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if the ingredient ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/-1`)
                .send({
                    id: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });

        it("should return 400 if the name is not a string", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    name: 12345
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name must be a string");
        });

        it("should return 400 if the name is empty", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    name: ""
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name required");
        });

        it("should return 400 if the description is not a string", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    description: 12345
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description must be a string");
        });

        it("should return 400 if the description is empty", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    description: ""
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description required");
        });

        it("should return 400 if the quantity is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    quantity: "not-a-number"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be a number");
        });

        it("should return 400 if the quantity is negative", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    quantity: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity cannot be negative");
        });

        it("should return 400 if the photo is not a string", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    photo: 12345
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo must be a string");
        });

        it("should return 400 if the photo is empty", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    photo: ""
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo required");
        });

        it("should return 400 if the product link is not a string", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    productLink: 12345
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product link must be a string");
        });

        it("should return 400 if the product link is empty", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    productLink: ""
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product link required");
        });

        it("should return 400 if the price is not a number", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    price: "not-a-number"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a number");
        });

        it("should return 400 if the price is negative", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({
                    price: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price cannot be negative");
        });

        it("should return 400 if there are no details to update", async () => {
            // Send request
            const response = await request(app)
                .put(`/api/v1/ingredients/update/${testingData.ingredient.id}`)
                .send({});

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("No details to update");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete an ingredient", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/${testingData.ingredient.id}`)
                .send();
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Ingredient deleted");

            // Check that ingredient was deleted
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/${testingData.ingredient.id + 30}`)
                .send();
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });
        
        it("should return 400 if the ingredient ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/not-a-number`)
                .send();

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if the ingredient ID is less than 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/ingredients/delete/-1`)
                .send({
                    id: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });
    });
});