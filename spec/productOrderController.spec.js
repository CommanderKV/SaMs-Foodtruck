import request from "supertest";
import { app } from "../app.js";
import db from "../models/index.js";

describe("ProductOrder Controller", () => {
    // Define testing data
    let testingData = {};
    beforeEach(async () => {
        // Create testing data
        testingData.product = await db.products.create({
            name: "Test Product",
            description: "Test Description",
            photo: "/public/imgs/github.png",
            price: 10.0
        });

        testingData.productOrder = await db.productOrders.create({
            productId: testingData.product.id,
            quantity: 2,
            price: 20.0
        });

        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "Test Ingredient Description",
            quantity: 10,
            price: 1.0,
            photo: "/public/imgs/github.png",
            productLink: "http://example.com",
        });

        testingData.customization = await db.customizations.create({
            name: "Extra Cheese",
            price: 2.0,
            quantity: 1,
        });
    });

    afterEach(async () => {
        // Remove all data
        await db.customizations.destroy({ where: {} });
        await db.productOrders.destroy({ where: {} });
        await db.products.destroy({ where: {} });
        await db.ingredients.destroy({ where: {} });
    });

    describe("GET /:id", () => {
        it("should return a product order by ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/productOrders/${testingData.productOrder.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.productOrder.id);
        });

        it("should return 404 for invalid ID", async () => {
            // Send a request
            const response = await request(app)
                .get(`/api/v1/productOrders/${testingData.productOrder.id + 10}`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for invalid ID format", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/productOrders/invalidId");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be a number");
        });

        it("should return 400 for negative ID", async () => {
            // Send a request
            const response = await request(app)
                .get("/api/v1/productOrders/-1");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be greater than 0");
        });
    });

    describe("POST /create", () => {
        it("should create a new product order", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: testingData.product.id,
                    quantity: 3,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data.quantity).toBe(3);
        });

        it("should return 400 for missing productId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    quantity: 3,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID required");
        });

        it("should return 400 for invalid productId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: "invalidId",
                    quantity: 3,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });

        it("should return 400 for negative productId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: -1,
                    quantity: 3,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be greater than 0");
        });

        it("should return 404 for non-existing productId", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: testingData.product.id + 10,
                    quantity: 3,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });

        it("should return 400 for missing quantity", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: testingData.product.id,
                    price: 30.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity required");
        });

        it("should return 400 for missing price", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/create")
                .send({
                    productId: testingData.product.id,
                    quantity: 3
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price required");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update a product order", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Product order updated");

            // Check the product order
            const updatedProductOrder = await db.productOrders.findByPk(testingData.productOrder.id);
            expect(updatedProductOrder.quantity).toBe(5);
        });

        it("should return 200 for no changes", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({});

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("No details to update");
        });

        it("should return 404 for non-existing product order", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id + 10}`)
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for invalid product order ID", async () => {
            // Send a request
            const response = await request(app)
                .put("/api/v1/productOrders/update/invalidId")
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be a number");
        });

        it("should return 400 for negative product order ID", async () => {
            // Send a request
            const response = await request(app)
                .put("/api/v1/productOrders/update/-1")
                .send({
                    quantity: 5
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be greater than 0");
        });

        it("should return 400 for invalid quantity", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({
                    quantity: -5
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Quantity must be greater than 0");
        });

        it("should return 400 for invalid price", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({
                    price: -5.0
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be greater than 0");
        });

        it("should return 400 for invalid productId", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({
                    productId: "invalidId"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });

        it("should return 404 for non-existing productId", async () => {
            // Send a request
            const response = await request(app)
                .put(`/api/v1/productOrders/update/${testingData.productOrder.id}`)
                .send({
                    productId: testingData.product.id + 10
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete a product order", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/delete/${testingData.productOrder.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Product order deleted");

            // Check to make sure the product order is deleted
            const deletedProductOrder = await db.productOrders.findByPk(testingData.productOrder.id);
            expect(deletedProductOrder).toBeNull();
        });

        it("should return 404 for non-existing product order", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/delete/${testingData.productOrder.id + 10}`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for invalid product order ID", async () => {
            // Send a request
            const response = await request(app)
                .delete("/api/v1/productOrders/delete/invalidId");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be a number");
        });

        it("should return 400 for negative product order ID", async () => {
            // Send a request
            const response = await request(app)
                .delete("/api/v1/productOrders/delete/-1");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be greater than 0");
        });
    });

    describe("POST /:id/customizations", () => {
        it("should add a customization to the product order", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id}/customizations`)
                .send({
                    customizationId: testingData.customization.id
                });

            // Check the response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
        });

        it("should return 404 for non-existing product order", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id + 10}/customizations`)
                .send({
                    customizationId: testingData.customization.id
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for invalid product order ID", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/invalidId/customizations")
                .send({
                    customizationId: testingData.customization.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be a number");
        });

        it("should return 400 for negative product order ID", async () => {
            // Send a request
            const response = await request(app)
                .post("/api/v1/productOrders/-1/customizations")
                .send({
                    customizationId: testingData.customization.id
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be greater than 0");
        });

        it("should return 404 for non-existing customization", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id}/customizations`)
                .send({
                    customizationId: testingData.customization.id + 10
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 400 for invalid customization ID", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id}/customizations`)
                .send({
                    customizationId: "invalidId"
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be a number");
        });

        it("should return 400 for negative customization ID", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id}/customizations`)
                .send({
                    customizationId: -1
                });

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be greater than 0");
        });

        it("should return 400 for missing customizationId", async () => {
            // Send a request
            const response = await request(app)
                .post(`/api/v1/productOrders/${testingData.productOrder.id}/customizations`)
                .send({});

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID required");
        });
    });

    describe("DELETE /:id/customizations/:customizationId", () => {
        it("should remove a customization from the product order", async () => {
            // Add a customization to the product order
            await testingData.productOrder.addCustomization(testingData.customization.id);

            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id}/customizations/${testingData.customization.id}`);

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.message).toBe("Customization removed from product order");
        });

        it("should return 404 for non-existing product order", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id + 10}/customizations/${testingData.customization.id}`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder not found");
        });

        it("should return 400 for invalid product order ID", async () => {
            // Send a request
            const response = await request(app)
                .delete("/api/v1/productOrders/invalidId/customizations/1");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be a number");
        });

        it("should return 400 for negative product order ID", async () => {
            // Send a request
            const response = await request(app)
                .delete("/api/v1/productOrders/-1/customizations/1");

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("ProductOrder ID must be greater than 0");
        });

        it("should return 404 for non-existing customization", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id}/customizations/${testingData.customization.id + 10}`);

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not found");
        });

        it("should return 400 for invalid customization ID", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id}/customizations/invalidId`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be a number");
        });

        it("should return 400 for negative customization ID", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id}/customizations/-1`);

            // Check the response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization ID must be greater than 0");
        });

        it("should return 404 for non-existing customization in product order", async () => {
            // Send a request
            const response = await request(app)
                .delete(`/api/v1/productOrders/${testingData.productOrder.id}/customizations/${testingData.customization.id}`);

            // Check the response
            expect(response.status).toBe(409);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Customization not linked to product order");
        });
    });
});
