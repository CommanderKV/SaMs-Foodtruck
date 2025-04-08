import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("Cart Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Create testing data
        testingData.user = await db.users.create({
            displayName: "Test User",
            service: "testing",
        });

        testingData.cart = await db.carts.create({
            orderTotal: 100.0,
            userId: testingData.user.id
        });

        testingData.product = await db.products.create({
            name: "Test Product",
            description: "Test Description",
            photo: "/public/imgs/github.png",
            price: 10.0
        });

        testingData.productOrder = await db.productOrders.create({
            cartId: testingData.cart.id,
            productId: testingData.product.id,
            quantity: 2,
            price: 20.0
        });
    });

    afterEach(async () => {
        // Remove all data
        await db.productOrders.destroy({ where: {} });
        await db.carts.destroy({ where: {} });
        await db.users.destroy({ where: {} });
        await db.products.destroy({ where: {} });
    });

    describe("GET /:id", () => {
        it("should return a cart by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/carts/${testingData.cart.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.cart.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/carts/${testingData.cart.id + 10}`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart not found");
        });

        it("should return 400 for invalid ID format", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/carts/not-a-number`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart ID must be a number");
        });

        it("Should return 400 for ID less than 1", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/carts/0`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart ID must be greater than 0");
        })
    });

    describe("POST /create", () => {
        it("should create a new cart", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    orderTotal: 50.0,
                    userId: testingData.user.id
                });

            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.orderTotal).toBe(50.0);
        });

        it("should return 400 for missing orderTotal", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    userId: testingData.user.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Order total required");
        });

        it("should return 400 for invalid orderTotal", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    orderTotal: "not-a-number",
                    userId: testingData.user.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Order total must be a number");
        });

        it("should return 400 for negative orderTotal", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    orderTotal: -50.0,
                    userId: testingData.user.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Order total must be greater than 0");
        });

        it("should return 400 for missing userId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    orderTotal: 50.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("UserId required");
        });

        it("should return 404 for invalid userId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/carts/create")
                .send({
                    orderTotal: 50.0,
                    userId: "invalid-user-id"
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("User not found");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update a cart", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/carts/update/${testingData.cart.id}`)
                .send({
                    orderTotal: 150.0
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("cart updated");

            // Check the cart
            const updatedCart = await db.carts.findByPk(testingData.cart.id);
            expect(updatedCart.orderTotal).toBe(150.0);
        });

        it("should return 200 for no changes", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/carts/update/${testingData.cart.id}`)
                .send({});

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("No details to update");
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/carts/update/${testingData.cart.id + 10}`)
                .send({
                    orderTotal: 150.0
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart not found");
        });

        it("should return 400 for invalid orderTotal", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/carts/update/${testingData.cart.id}`)
                .send({
                    orderTotal: "not-a-number"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Order total must be a number");
        });

        it("should return 400 for negative orderTotal", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/carts/update/${testingData.cart.id}`)
                .send({
                    orderTotal: -50.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Order total must be greater than 0");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete a cart", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/carts/delete/${testingData.cart.id}`);
            
            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Cart deleted");

            // Check to make sure the cart is deleted
            const deletedCart = await db.carts.findByPk(testingData.cart.id);
            expect(deletedCart).toBeNull();
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/carts/delete/${testingData.cart.id + 10}`);
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart not found");
        });
    });

    describe("POST /:id/products", () => {
        it("should add a product to the cart", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({
                    productOrderId: testingData.productOrder.id
                });

            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
        });

        it("should return 404 for invalid cart ID", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/carts/${testingData.cart.id + 10}/products`)
                .send({
                    productOrderId: testingData.productOrder.id
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart not found");
        });

        it("should return 404 for invalid productOrder ID", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({
                    productOrderId: testingData.productOrder.id + 10
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for missing productOrderId", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({});

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID required");
        });

        it("should return 409 if product is already in the cart", async () => {
            // Send an initial request to add the product
            await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({
                    productOrderId: testingData.productOrder.id
                });

            // Send a request to add the same product again
            const response = await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({
                    productOrderId: testingData.productOrder.id
                });

            // Check the response
            expect(response.status).toBe(409);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product already linked to cart");
        });
    });

    describe("DELETE /:id/products/:productId", () => {
        it("should remove a product from the cart", async () => {
            // First, add the product to the cart
            await request(app)
                .post(`/api/v1/carts/${testingData.cart.id}/products`)
                .send({
                    productOrderId: testingData.productOrder.id
                });

            // send a request
            const response = await request(app)
                .delete(`/api/v1/carts/${testingData.cart.id}/products/${testingData.productOrder.id}`);

            // check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Product removed from cart");
        });

        it("should return 404 if cart is not found", async () => {
            // send a request
            const response = await request(app)
                .delete(`/api/v1/carts/${testingData.cart.id + 10}/products/${testingData.productOrder.id}`);

            // check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Cart not found");
        });

        it("should return 409 if product is not linked to cart", async () => {
            // send a request
            const response = await request(app)
                .delete(`/api/v1/carts/${testingData.cart.id}/products/${testingData.productOrder.id}`);

            // check the response
            expect(response.status).toBe(409);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not linked to cart");
        });
    });
});
