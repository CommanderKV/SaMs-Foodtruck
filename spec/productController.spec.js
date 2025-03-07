// Import the required modules
import request from 'supertest'; // assuming you're using supertest for API tests
import { app } from '../app.js'; // Path to the Express app
import db from '../models/index.js'; // Path to your DB models
import fs from 'fs';

describe('Product Controller Tests', () => {

    // Clear the database before each test
    beforeEach(async () => {
        // Clear the products table
        await db.products.findAll().then((products) => {
            products.forEach(async (product) => {
                await product.destroy();
            });
        });
    });

    describe('GET /api/v1/products', () => {
        it('should fetch all products', async () => {
            // Create a sample product to test
            await db.products.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 9.99,
                photo: 'test-photo-path'
            });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/products');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(1);
        });
    });

    describe("GET /api/v1/products/:id", () => {
        it("Should get one product by id", async () => {
            // Create a sample product to test
            const product = await db.products.create({
                name: "Test Product",
                description: "Test Description",
                price: 9.99,
                photo: "test-photo-path"
            });

            // Send a GET request to the endpoint
            const response = await request(app).get(`/api/v1/products/${product.id}`);

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(product.id);
        });

        it("Should return 404 if the product is not found", async () => {
            // Create a sample product to test
            await db.products.create({
                name: "Test Product",
                description: "Test Description",
                price: 9.99,
                photo: "test-photo-path"
            });

            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/products/1");

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });
    });

    describe("POST /api/v1/products/create", () => {
        it("Should create a new product", async () => {
            // Converting image into base64
            const image = fs.readFileSync("./public/imgs/github.png");
            const encodedImage = `data:image/png;base64,${image.toString("base64")}`;

            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "Test Product",
                    description: "Test Description",
                    price: 9.99,
                    photo: encodedImage
                });

            // Check the status code and response structure
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.name).toBe("Test Product");

            // Remove the image from the public folder
            fs.unlinkSync(`./public/imgs/${response.body.data.photo}`);
        });

        it("Should return 400 if the request is invalid", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    description: "Test Description",
                    price: 9.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name is required");
        });

        it("Should return 400 if the price is invalid", async () => {

            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "Test Product",
                    description: "Test Description",
                    price: -9.99,
                });
    

            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be greater than 0");
        });

        it("Should return 400 if the image is invalid", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "Test Product",
                    description: "Test Description",
                    price: 9.99,
                    photo: "invalid-image"
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid Base64 format");
        });
    });

    describe("PUT /update", () => {
        it("Should update a product", async () => {
            // Create a sample product to test
            const product = await db.products.create({
                name: "Test Product",
                description: "Test Description",
                price: 9.99,
                photo: "test-photo-path"
            });

            // Send a PUT request to the endpoint
            const response = await request(app)
                .put("/api/v1/products/update")
                .send({
                    id: product.id,
                    name: "Updated Product",
                    description: "Updated Description",
                    price: 19.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Product updated successfully");

            // Check if the product was updated in the database
            const updatedProduct = await db.products.findByPk(product.id);
            expect(updatedProduct.name).toBe("Updated Product");
            expect(updatedProduct.description).toBe("Updated Description");
            expect(updatedProduct.price).toBe("19.99");
        });
    });
});

