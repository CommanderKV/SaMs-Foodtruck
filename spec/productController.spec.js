// Import the required modules
import request from 'supertest';
import { app } from '../app.js';
import db from '../models/index.js';
import fs from 'fs';

describe('Product Controller', () => {
    // Setup test data before tests
    let testingData = {};
    
    beforeEach(async () => {
        // Create test data - product, ingredients, option groups, etc.
        testingData.category = await db.categories.create({
            name: "Test Category",
            description: "Test Category Description"
        });
        
        testingData.product = await db.products.create({
            name: "Test Product",
            description: "Test Description",
            photo: "default.jpg",
            price: 9.99
        });
        
        // Link product to category through the junction table
        await testingData.product.addCategory(testingData.category);
        
        testingData.ingredient = await db.ingredients.create({
            name: "Test Ingredient",
            description: "Test Ingredient Description",
            quantity: 100,
            photo: "default.jpg",
            price: 5.99
        });
        
        // Link ingredient to product through junction table with quantity and measurement
        await testingData.product.addIngredient(testingData.ingredient, {
            through: {
                quantity: 10,
                measurement: "g"
            }        
        });

        // Create option group linked to the product
        testingData.optionGroup = await testingData.product.createOptionGroup({
            sectionName: "Test Option Group"
        });

        // Create option linked to the option group and ingredient
        testingData.option = await testingData.optionGroup.createOption({
            priceAdjustment: 1.50,
            multipleChoice: true,
            minQuantity: 0,
            maxQuantity: 1,
            ingredientId: testingData.ingredient.id
        });
    });
    
    afterEach(async () => {
        // Clean up test data - delete in reverse order of dependencies
        await db.options.destroy({ where: {} });
        await db.optionGroups.destroy({ where: {} });
        await db.ingredientsToProducts.destroy({ where: {} });
        await db.ingredients.destroy({ where: {} });
        await db.products.destroy({ where: {} });
        await db.categories.destroy({ where: {} });
    });

    describe("GET /", () => {
        it("should return all products", async () => {
            // Send GET request
            const response = await request(app).get("/api/v1/products/");
            
            // Check response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            
            // Check if our test product is in the response
            const testProduct = response.body.data.find(p => p.id === testingData.product.id);
            expect(testProduct).toBeDefined();
            expect(testProduct.name).toBe("Test Product");
        });
        
        it("should return products with their associated categories", async () => {
            const response = await request(app).get("/api/v1/products/");
            
            const testProduct = response.body.data.find(p => p.id === testingData.product.id);
            expect(testProduct.categories).toBeDefined();
            expect(Array.isArray(testProduct.categories)).toBe(true);
            expect(testProduct.categories.length).toBeGreaterThanOrEqual(1);
            expect(testProduct.categories[0].id).toBe(testingData.category.id);
            expect(testProduct.categories[0].name).toBe("Test Category");
        });

        it("should return products with their associated ingredients", async () => {
            const response = await request(app).get("/api/v1/products/");
            
            const testProduct = response.body.data.find(p => p.id === testingData.product.id);
            expect(testProduct.ingredients).toBeDefined();
            expect(Array.isArray(testProduct.ingredients)).toBe(true);
            expect(testProduct.ingredients.length).toBe(1);
            expect(testProduct.ingredients[0].id).toBe(testingData.ingredient.id);
            expect(testProduct.ingredients[0].name).toBe("Test Ingredient");
        });

        it("should return products with their associated option groups and options", async () => {
            const response = await request(app).get("/api/v1/products/");
            
            const testProduct = response.body.data.find(p => p.id === testingData.product.id);
            expect(testProduct.optionGroups).toBeDefined();
            expect(Array.isArray(testProduct.optionGroups)).toBe(true);
            expect(testProduct.optionGroups.length).toBe(1);
            expect(testProduct.optionGroups[0].id).toBe(testingData.optionGroup.id);
            expect(testProduct.optionGroups[0].sectionName).toBe("Test Option Group");
            
            // Check options within option group
            expect(testProduct.optionGroups[0].options).toBeDefined();
            expect(Array.isArray(testProduct.optionGroups[0].options)).toBe(true);
            expect(testProduct.optionGroups[0].options.length).toBe(1);
            expect(testProduct.optionGroups[0].options[0].id).toBe(testingData.option.id);
        });
    });
    
    describe("GET /:id", () => {
        it("should return a single product by ID", async () => {
            // Send GET request
            const response = await request(app).get(`/api/v1/products/${testingData.product.id}`);
            
            // Check response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.product.id);
            expect(response.body.data.name).toBe("Test Product");
            expect(response.body.data.description).toBe("Test Description");
            expect(response.body.data.price).toBe(9.99);
        });
        
        it("should return product with its associated ingredients", async () => {
            const response = await request(app).get(`/api/v1/products/${testingData.product.id}`);
            
            const ingredients = response.body.data.ingredients;
            expect(ingredients).toBeDefined();
            expect(Array.isArray(ingredients)).toBe(true);
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].id).toBe(testingData.ingredient.id);
            expect(ingredients[0].name).toBe("Test Ingredient");
        });
        
        it("should return product with its option groups and options", async () => {
            const response = await request(app).get(`/api/v1/products/${testingData.product.id}`);
            
            expect(response.body.data.optionGroups).toBeDefined();
            expect(Array.isArray(response.body.data.optionGroups)).toBe(true);
            expect(response.body.data.optionGroups.length).toBe(1);
            expect(response.body.data.optionGroups[0].id).toBe(testingData.optionGroup.id);
            expect(response.body.data.optionGroups[0].sectionName).toBe("Test Option Group");
            
            // Check options within option group
            expect(response.body.data.optionGroups[0].options).toBeDefined();
            expect(Array.isArray(response.body.data.optionGroups[0].options)).toBe(true);
            expect(response.body.data.optionGroups[0].options.length).toBe(1);
            expect(response.body.data.optionGroups[0].options[0].id).toBe(testingData.option.id);
        });
        
        it("should return 404 if product is not found", async () => {
            // Send GET request with non-existent ID
            const response = await request(app).get(`/api/v1/products/9999`);
            
            // Check response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });
        
        it("should return 400 if ID is not a valid number", async () => {
            // Send GET request with invalid ID
            const response = await request(app).get("/api/v1/products/not-a-number");
            
            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });
        
        it("should return 400 if ID is 0 or negative", async () => {
            // Send GET request with invalid ID
            const response = await request(app).get("/api/v1/products/0");
            
            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid product ID");
        });
    });
    
    describe("POST /create", () => {
        it("should create a new product with valid data", async () => {
            // Create a base64 encoded photo string for testing
            const photoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="; // Minimal valid base64
            
            // Data for the new product
            const newProductData = {
                name: "New Product",
                description: "New Description",
                price: 12.99,
                photo: photoBase64,
            };
            
            // Send POST request
            const response = await request(app)
                .post("/api/v1/products/create")
                .send(newProductData);
            
            // Check response
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("success");
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.name).toBe("New Product");
            
            // Check that product was actually created in database
            const createdProduct = await db.products.findByPk(response.body.data.id);
            expect(createdProduct).not.toBeNull();
            expect(createdProduct.name).toBe("New Product");
            expect(createdProduct.price).toBe(12.99);
            expect(createdProduct.photo).not.toBeNull();

            // Check that the photo was saved to the public/imgs folder
            const photoPath = `public/imgs/${createdProduct.photo}`;
            expect(fs.existsSync(photoPath)).toBe(true);
            fs.promises.unlink(photoPath);
        });
        
        it("should return 400 if name is missing", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    description: "New Description",
                    price: 12.99,
                    photo: "default.jpg"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Name is required");
        });
        
        it("should return 400 if description is missing", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "New Product",
                    price: 12.99,
                    photo: "default.jpg"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Description is required");
        });
        
        it("should return 400 if photo is missing", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "New Product",
                    description: "New Description",
                    price: 12.99
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo is required");
        });
        
        it("should return 400 if price is missing", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "New Product",
                    description: "New Description",
                    photo: "default.jpg"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price is required");
        });
        
        it("should return 400 if price is not a number", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "New Product",
                    description: "New Description",
                    photo: "default.jpg",
                    price: "not-a-number"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a decimal number");
        });
        
        it("should return 400 if price is negative", async () => {
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "New Product",
                    description: "New Description",
                    photo: "default.jpg",
                    price: -10.99
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price cannot be negative");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update a product with valid data", async () => {
            // Create a base64 encoded photo string for testing
            const photoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="; // Minimal valid base64
            
            // Data for updating the product
            const updateData = {
                id: testingData.product.id,
                name: "Updated Product",
                description: "Updated Description",
                price: 14.99,
                photo: photoBase64
            };
            
            // Send PUT request
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send(updateData);
            
            // Check response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Check that product was actually updated in database
            const updatedProduct = await db.products.findByPk(testingData.product.id);
            expect(updatedProduct.name).toBe("Updated Product");
            expect(updatedProduct.description).toBe("Updated Description");
            expect(updatedProduct.price).toBe(14.99);
            expect(updatedProduct.photo).not.toBeNull();

            // Check that the photo was saved to the public/imgs folder
            const photoPath = `public/imgs/${updatedProduct.photo}`;
            expect(fs.existsSync(photoPath)).toBe(true);
            fs.promises.unlink(photoPath);
        });
        
        it("should be able to update only the name", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    name: "Only Name Updated"
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            const updatedProduct = await db.products.findByPk(testingData.product.id);
            expect(updatedProduct.name).toBe("Only Name Updated");
            expect(updatedProduct.description).toBe("Test Description"); // Should be unchanged
        });
        
        it("should be able to update only the description", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    description: "Only Description Updated"
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            const updatedProduct = await db.products.findByPk(testingData.product.id);
            expect(updatedProduct.name).toBe("Test Product"); // Should be unchanged
            expect(updatedProduct.description).toBe("Only Description Updated");
        });
        
        it("should be able to update only the price", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    price: 15.99
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            const updatedProduct = await db.products.findByPk(testingData.product.id);
            expect(updatedProduct.name).toBe("Test Product"); // Should be unchanged
            expect(updatedProduct.price).toBe(15.99);
        });
        
        it("should return 400 if IDs in path and body don't match", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id + 1,
                    name: "Updated Product"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID mismatch");
        });
        
        it("should return 404 if product is not found", async () => {
            const nonExistentId = 9999;
            const response = await request(app)
                .put(`/api/v1/products/update/${nonExistentId}`)
                .send({
                    id: nonExistentId,
                    name: "Updated Product"
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });
        
        it("should return 400 if ID is not a valid number", async () => {
            const response = await request(app)
                .put("/api/v1/products/update/not-a-number")
                .send({
                    id: "not-a-number",
                    name: "Updated Product"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });
        
        it("should return 400 if price is not a number", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    price: "not-a-number"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price must be a decimal number");
        });
        
        it("should return 400 if price is negative", async () => {
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    price: -10.99
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Price cannot be negative");
        });
    });

    describe("DELETE /delete/:id", () => {
        it("should delete the product and any attached links from the db", async () => {
            // Run the api
            const response = await request(app)
                .delete(`/api/v1/products/delete/${testingData.product.id}`)
                .send({
                    id: testingData.product.id
                });

            // Check the response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.message).toBe("Product deleted successfully");

            // Make sure the product is deleted
            const deletedProduct = await db.products.findByPk(testingData.product.id);
            expect(deletedProduct).toBeNull();

            // Make sure the ingredient-product link is deleted
            const deletedIngredientLink = await testingData.product.getIngredients();
            expect(deletedIngredientLink).toEqual([]);
            
            // Make sure the option group is deleted (due to cascade)
            const deletedOptionGroup = await db.optionGroups.findByPk(testingData.optionGroup.id);
            expect(deletedOptionGroup).toBeNull();
            
            // Make sure the option-group link is deleted
            const deletedOptionGroupLink = await testingData.product.getOptionGroups();
            expect(deletedOptionGroupLink).toEqual([]);

            // Make sure the ingredient is still there
            const notDeletedIngredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(notDeletedIngredient).not.toBeNull();
            
            // Make sure the option is still there (not cascaded through option group)
            const notDeletedOption = await db.options.findByPk(testingData.option.id);
            expect(notDeletedOption).not.toBeNull();
        });

        it("should return 404 if the wrong ID is given", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/${testingData.product.id + 1}`)
                .send({
                    id: testingData.product.id + 1
                });

            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found")
        });

        it("should return 400 if the product ID is invalid", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/invalid-id`)

            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });

        it("should return 400 if the product ID is not a number", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/not-a-number`)
                .send({
                    id: "not-a-number"
                });

            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });

        it("should return 400 if the product ID is less than or equal to 0", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/0`)
                .send({
                    id: 0
                });

            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid product ID");
        });
    });
    
    describe("POST /:id/categories", () => {
        it("should add a category to a product", async () => {
            // Create a new category
            const newCategory = await db.categories.create({
                name: "New Category",
                description: "New Category Description"
            });
            
            // Send request to add the category
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: newCategory.id
                });
            
            // Check response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify category was added to product
            const product = await db.products.findByPk(testingData.product.id, {
                include: [db.categories]
            });
            
            const linkedCategory = product.categories.find(c => c.id === newCategory.id);
            expect(linkedCategory).toBeDefined();
        });
        
        it("should return 409 if category is already linked", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: testingData.category.id
                });
            
            expect(response.status).toBe(409);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category already linked to product");
        });
        
        it("should return 404 if category is not found", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: 9999
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("should return 400 if category ID is not a number", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: "not-a-number"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be a number");
        });

        it("should return 400 if category ID is 0 or negative", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: 0
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be greater than 0");
        });

        it("should return 400 if category ID is missing", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/categories`)
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID is required");
        });
    });
    
    describe("DELETE /:id/categories", () => {
        it("should remove a category from a product", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: testingData.category.id
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify category was removed from product
            const product = await db.products.findByPk(testingData.product.id, {
                include: [db.categories]
            });
            
            const linkedCategory = product.categories.find(c => c.id === testingData.category.id);
            expect(linkedCategory).toBeUndefined();
        });
        
        it("should return 404 if category is not linked", async () => {
            // Create an unlinked category
            const unlinkedCategory = await db.categories.create({
                name: "Unlinked Category",
                description: "Unlinked Category Description"
            });
            
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: unlinkedCategory.id
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category is not linked to product");
        });

        it("should return 404 if category is not found", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: 9999
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category not found");
        });

        it("should return 400 if category ID is not a number", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: "not-a-number"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be a number");
        });

        it("should return 400 if category ID is 0 or negative", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({
                    id: 0
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID must be greater than 0");
        });

        it("should return 400 if category ID is missing", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/categories`)
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category ID is required");
        });
    });
    
    describe("POST /:id/ingredients", () => {
        it("should add an ingredient to a product", async () => {
            // Create a new ingredient
            const newIngredient = await db.ingredients.create({
                name: "New Ingredient",
                description: "New Ingredient Description",
                quantity: 100,
                photo: "default.jpg",
                price: 3.99
            });
            
            // Send request to add the ingredient
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: newIngredient.id,
                    quantity: 5,
                    measurement: "oz"
                });
            
            // Check response
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify ingredient was added to product
            const ingredientLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: newIngredient.id
                }
            });
            
            expect(ingredientLink).not.toBeNull();
            expect(ingredientLink.quantity).toBe(5);
            expect(ingredientLink.measurement).toBe("oz");
        });
        
        it("should return 409 if ingredient is already linked", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: 5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(409);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient already linked to product");
        });
        
        it("should return 400 if quantity is missing", async () => {
            // Create a new ingredient
            const newIngredient = await db.ingredients.create({
                name: "Another Ingredient",
                description: "Another Ingredient Description",
                quantity: 100,
                photo: "default.jpg",
                price: 2.99
            });
            
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: newIngredient.id,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity is required");
        });
        
        it("should return 400 if measurement is missing", async () => {
            // Create a new ingredient
            const newIngredient = await db.ingredients.create({
                name: "Another Ingredient",
                description: "Another Ingredient Description",
                quantity: 100,
                photo: "default.jpg",
                price: 2.99
            });
            
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: newIngredient.id,
                    quantity: 5
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient measurement is required");
        });

        it("should return 404 if ingredient is not found", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: 9999,
                    quantity: 5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if ingredient ID is not a number", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: "not-a-number",
                    quantity: 5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if ingredient ID is 0 or negative", async () => {
            const response = await request(app)
                .post(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: 0,
                    quantity: 5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });
    });
    
    describe("PUT /:id/ingredients", () => {
        it("should update an ingredient link", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: 15,
                    measurement: "kg"
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify ingredient link was updated
            const updatedLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: testingData.ingredient.id
                }
            });
            
            expect(updatedLink.quantity).toBe(15);
            expect(updatedLink.measurement).toBe("kg");
        });
        
        it("should return 404 if ingredient is not linked", async () => {
            // Create an unlinked ingredient
            const unlinkedIngredient = await db.ingredients.create({
                name: "Unlinked Ingredient",
                description: "Unlinked Ingredient Description",
                quantity: 100,
                photo: "default.jpg",
                price: 1.99
            });
            
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: unlinkedIngredient.id,
                    quantity: 5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient is not linked to product");
        });
        
        it("should update only quantity if measurement is not provided", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: 20
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify only quantity was updated
            const updatedLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: testingData.ingredient.id
                }
            });
            
            expect(updatedLink.quantity).toBe(20);
            expect(updatedLink.measurement).toBe("g"); // Original measurement unchanged
        });
        
        it("should update only measurement if quantity is not provided", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    measurement: "kg"
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify only measurement was updated
            const updatedLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: testingData.ingredient.id
                }
            });
            
            expect(updatedLink.quantity).toBe(10); // Original quantity unchanged
            expect(updatedLink.measurement).toBe("kg");
        });

        it("should return 400 if quantity is not a number", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: "not-a-number",
                    measurement: "oz"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity must be a number");
        });

        it("should return 400 if quantity is negative", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: -5,
                    measurement: "oz"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity must be greater than 0");
        });

        it("should return 400 if measurement is a number", async () => {
            const response = await request(app)
                .put(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id,
                    quantity: 5,
                    measurement: 10
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient measurement must be a string");
        });
    });
    
    describe("DELETE /:id/ingredients", () => {
        it("should remove an ingredient from a product", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: testingData.ingredient.id
                });
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            
            // Verify ingredient link was removed
            const deletedLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: testingData.ingredient.id
                }
            });
            
            expect(deletedLink).toBeNull();
            
            // Make sure the ingredient itself still exists
            const ingredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(ingredient).not.toBeNull();
        });
        
        it("should return 404 if ingredient is not linked", async () => {
            // Create an unlinked ingredient
            const unlinkedIngredient = await db.ingredients.create({
                name: "Unlinked Ingredient",
                description: "Unlinked Ingredient Description",
                quantity: 100,
                photo: "default.jpg",
                price: 1.99
            });
            
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: unlinkedIngredient.id
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient is not linked to product");
        });

        it("should return 404 if ingredient is not found", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: 9999
                });
            
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if ingredient ID is not a number", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: "not-a-number"
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if ingredient ID is 0 or negative", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({
                    id: 0
                });
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be greater than 0");
        });

        it("should return 400 if ingredient ID is missing", async () => {
            const response = await request(app)
                .delete(`/api/v1/products/${testingData.product.id}/ingredients`)
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID is required");
        });
    });
});

