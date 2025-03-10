// Import the required modules
import request from 'supertest';
import { app } from '../app.js';
import db from '../models/index.js';
import fs from 'fs';

describe('Product Controller', () => {
    // Clear the DB and generate the testing data
    let testingData = {}
    beforeEach(async () => {
        // Clear the ingredients to products table
        await db.ingredientsToProducts.destroy({ where: {} });

        // Clear the products table
        await db.products.findAll().then((products) => {
            products.forEach(async (product) => {
                await product.removeIngredients(await product.getIngredients());
                await product.removeCategories(await product.getCategories());
                await product.destroy();
            });
        });

        // Clear the ingredients table
        await db.ingredients.destroy({ where: {} });

        // Clear the categories table
        await db.categories.destroy({ where: {} });

        // Generate testing data
        testingData.ingredient = await db.ingredients.create({
            name: "testIngredient",
            description: "Testing",
            quantity: 3,
            photo: "testing.png",
            productLink: "testing",
            price: 3.99
        });
        
        testingData.product = await db.products.create({
            name: "Test Product",
            description: "Test Description",
            price: 9.99,
            photo: "test-photo-path"
        });

        await testingData.product.addIngredient(
            testingData.ingredient, 
            { 
                through: { 
                    quantity: 1,
                    measurement: "test" 
                } 
            }
        );

        testingData.category = await db.categories.create({
            name: "testCategory",
            description: "Testing"
        });

        await testingData.product.addCategory(testingData.category);

        // Create a new option group
        testingData.optionGroup = await testingData.product.createOptionGroup({
            sectionName: "New Option Group"
        });

        // Create a new option
        testingData.option = await testingData.optionGroup.createOption({
            ingredientId: testingData.ingredient.id,
            priceAdjustment: 0.50,
            multipleChoice: true,
            minQuantity: 1,
            maxQuantity: 1
        });
    });

    describe('GET /', () => {
        it("should fetch all products", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/products');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(1);
        });

        it("should return an empty array if no products exist", async () => {
            // Clear the products table
            await db.products.destroy({ where: {} });

            // Send a GET request to the endpoint
            const response = await request(app).get('/api/v1/products');

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveSize(0);
        });
    });

    describe("GET /:id", () => {
        it("should get one product by id", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get(`/api/v1/products/${testingData.product.id}`);

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect(response.body.data.id).toBe(testingData.product.id);
        });

        it("should return 404 if the product is not found", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/products/1");

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });

        it("should return 400 if the product ID is invalid", async () => {
            // Send a GET request to the endpoint
            const response = await request(app).get("/api/v1/products/invalid-id");

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Invalid product ID");
        });
    });

    describe("POST /create", () => {
        it("should create a new product", async () => {
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

        it("should return 400 if the name is missing", async () => {
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

        it("should return 400 if the price is invalid", async () => {
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

        it("should return 400 if the image is invalid", async () => {
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

        it("should return 400 if the photo is missing", async () => {
            // Send a POST request to the endpoint
            const response = await request(app)
                .post("/api/v1/products/create")
                .send({
                    name: "Test Product",
                    description: "Test Description",
                    price: 9.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Photo is required");
        });
    });

    describe("PUT /update/:id", () => {
        it("should update product and ingredients", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    name: "Updated Product",
                    description: "Updated Description",
                    price: 19.99,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: 2,
                        }
                    ],
                    categories: {
                        add: [],
                        remove: [testingData.category.id]
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect("message" in response.body.data).toBeTruthy();

            // Check if the product was updated in the database
            const updatedProduct = await db.products.findByPk(testingData.product.id);
            expect(updatedProduct.name).toBe("Updated Product");
            expect(updatedProduct.description).toBe("Updated Description");
            expect(updatedProduct.price).toBe(19.99);

            // Check if the ingredient was updated in the database
            const ingredients = await updatedProduct.getIngredients();
            expect(ingredients[0].ingredientsToProducts.quantity).toBe(2);
        });

        it("should update ingredients linked to a product", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: 2,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect("message" in response.body.data).toBeTruthy();

            // Check if the ingredients were updated
            const product = await db.products.findByPk(testingData.product.id);
            const ingredients = await product.getIngredients();

            expect(ingredients[0].ingredientsToProducts.quantity).toBe(2);
            expect(ingredients[0].ingredientsToProducts.measurement).toBe("tester");
        });

        it("should update categories linked to a product", async () => {
            // Make a new category
            const newCategory = await db.categories.create({
                name: "newCategory",
                description: "newCategory"
            });
            
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {
                        add: [newCategory.id],
                        remove: [testingData.category.id]
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect("message" in response.body.data).toBeTruthy();

            // Check if the categories were updated
            const product = await db.products.findByPk(testingData.product.id);
            const categories = await product.countCategories();

            // This doesn't make sense given the input. When running a put and get
            // request the category is removed from the product
            // I believe the before each func is running while
            // trying to get the data for this check
            expect(categories).toBe(1);
        });

        it("should return 400 if categories.add is not an array", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {
                        add: "not-an-array",
                        remove: [testingData.category.id]
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Add categories must be an array");
        });

        it("should return 400 if categories.remove is not an array", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {
                        add: [testingData.category.id],
                        remove: "not-an-array"
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Remove categories must be an array");
        });

        it("should return 404 if a category to add is not found", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {
                        add: [9999], // Assuming this ID does not exist
                        remove: [testingData.category.id]
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category with 9999 id not found");
        });

        it("should return 404 if a category to remove is not found", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {
                        add: [testingData.category.id],
                        remove: [9999] // Assuming this ID does not exist
                    }
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Category with 9999 id not found");
        });

        it("should return 400 if categories object is empty", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    categories: {}
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Categories must have either add or remove options");
        });

        it("should return 400 if ingredients is not an array", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: "not-an-array"
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredients must be an array");
        });

        it("should return 404 if an ingredient to update is not found", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: 9999, // Assuming this ID does not exist
                            quantity: 2,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if an ingredient ID is not a number", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: "not-a-number",
                            quantity: 2,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID must be a number");
        });

        it("should return 400 if an ingredient quantity is not a number", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: "not-a-number",
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity must be a number");
        });

        it("should return 400 if an ingredient measurement is not a string", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: 2,
                            measurement: 12345
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient measurement must be a string");
        });

        it("should return 400 if an ingredient quantity is less than or equal to 0", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: 0,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity must be greater than 0");
        });

        it("should return 400 if an ingredient measurement is an empty string", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id,
                            quantity: 2,
                            measurement: ""
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient measurement must not be empty");
        });

        it("should return 400 if an ingredient ID is missing", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            quantity: 2,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient ID is required");
        });

        it("should return 400 if an ingredient quantity is missing", async () => {
            // Create another ingredient
            const newIngredient = await db.ingredients.create({
                name: "newIngredient",
                description: "Testing",
                quantity: 3,
                photo: "testing.png",
                productLink: "testing",
                price: 3.99
            });
            
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: newIngredient.id,
                            measurement: "tester"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient quantity is required");
        });

        it("should return 400 if an ingredient measurement is missing", async () => {
            // Create another ingredient
            const newIngredient = await db.ingredients.create({
                name: "newIngredient",
                description: "Testing",
                quantity: 3,
                photo: "testing.png",
                productLink: "testing",
                price: 3.99
            });
            
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: newIngredient.id,
                            quantity: 2
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient measurement is required");
        });

        it("should return 400 if no fields are defined for update", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    ingredients: [
                        {
                            id: testingData.ingredient.id
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient needs quantity or measurement");
        });

        it("should return 400 if no id is given", async () => {
            // Send a request
            const response = await request(app)
                .put("/api/v1/products/update/")
                .send();
            
            // Check the request
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toContain("Product ID is required");
        });

        it("should return 404 if the wrong id is given", async () => {
            // Send the request
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id + 1}`)
                .send({
                    id: testingData.product.id + 1,
                    description: "hi"
                });
            
            // Check the response
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product not found");
        });

        it("should return 400 if the product ID is invalid", async () => {
            // Send a PUT request to the endpoint
            const response = await request(app)
                .put(`/api/v1/products/update/invalid-id`)
                .send({
                    id: "invalid-id",
                    name: "Updated Product",
                    description: "Updated Description",
                    price: 19.99
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID must be a number");
        });

        it("should update option groups linked to a product", async () => {
            // Send a PUT request to update the option group
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    priceAdjustment: 1.00,
                                    multipleChoice: false,
                                    minQuantity: 2,
                                    maxQuantity: 2
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("success");
            expect("message" in response.body.data).toBeTruthy();

            // Check if the option group was updated in the database
            const updatedOptionGroup = await db.optionGroups.findByPk(testingData.optionGroup.id);
            expect(updatedOptionGroup.sectionName).toBe("Updated Option Group");

            // Check if the option was updated in the database
            const updatedOption = await db.options.findByPk(testingData.option.id);
            expect(updatedOption.priceAdjustment).toBe(1.00);
            expect(updatedOption.multipleChoice).toBe(false);
            expect(updatedOption.minQuantity).toBe(2);
            expect(updatedOption.maxQuantity).toBe(2);
        });

        it("should return 400 if option group ID is not a number", async () => {
            // Send a PUT request with invalid option group ID
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: "not-a-number",
                            sectionName: "Updated Option Group"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup ID must be a number");
        });

        it("should return 404 if option group is not found", async () => {
            // Send a PUT request with non-existing option group ID
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: 9999, // Assuming this ID does not exist
                            sectionName: "Updated Option Group"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup not found");
        });

        it("should return 400 if option ID is not a number", async () => {
            // Send a PUT request with invalid option ID
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: "not-a-number",
                                    priceAdjustment: 1.00
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ID must be a number");
        });

        it("should return 404 if option is not found", async () => {
            // Send a PUT request with non-existing option ID
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: 9999, // Assuming this ID does not exist
                                    priceAdjustment: 1.00
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option not found");
        });

        it("should return 400 if option ingredientId is not a number", async () => {
            // Send a PUT request with invalid ingredientId
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    ingredientId: "not-a-number"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option ingredientId must be a number");
        });

        it("should return 404 if option ingredient is not found", async () => {
            // Send a PUT request with non-existing ingredientId
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    ingredientId: 9999 // Assuming this ID does not exist
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(404);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Ingredient not found");
        });

        it("should return 400 if option priceAdjustment is not a number", async () => {
            // Send a PUT request with invalid priceAdjustment
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    priceAdjustment: "not-a-number"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option priceAdjustment must be a number");
        });

        it("should return 400 if option multipleChoice is not a boolean", async () => {
            // Send a PUT request with invalid multipleChoice
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    multipleChoice: "not-a-boolean"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option multipleChoice must be a boolean");
        });

        it("should return 400 if option minQuantity is not a number", async () => {
            // Send a PUT request with invalid minQuantity
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    minQuantity: "not-a-number"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option minQuantity must be a number");
        });

        it("should return 400 if option maxQuantity is not a number", async () => {
            // Send a PUT request with invalid maxQuantity
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    maxQuantity: "not-a-number"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option maxQuantity must be a number");
        });

        it("should return 400 if option remove is not a boolean", async () => {
            // Send a PUT request with invalid remove
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            items: [
                                {
                                    id: testingData.option.id,
                                    remove: "not-a-boolean"
                                }
                            ]
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Option remove must be a boolean");
        });

        it("should return 400 if optionGroup remove is not a boolean", async () => {
            // Send a PUT request with invalid optionGroup remove
            const response = await request(app)
                .put(`/api/v1/products/update/${testingData.product.id}`)
                .send({
                    id: testingData.product.id,
                    options: [
                        {
                            id: testingData.optionGroup.id,
                            sectionName: "Updated Option Group",
                            remove: "not-a-boolean"
                        }
                    ]
                });

            // Check the status code and response structure
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("OptionGroup remove must be a boolean");
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

            // Make sure the link is deleted
            const deletedLink = await db.ingredientsToProducts.findOne({
                where: {
                    productId: testingData.product.id,
                    ingredientId: testingData.ingredient.id
                }
            });
            expect(deletedLink).toBeNull();

            // Make sure the ingredient is still there
            const notDeletedIngredient = await db.ingredients.findByPk(testingData.ingredient.id);
            expect(notDeletedIngredient).toBeDefined();
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

        it("should return 400 if no ID is given", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/`)
                .send();
            
            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID is required");
        });

        it("should return 400 if ids don't match", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/${testingData.product.id}`)
                .send({
                    id: testingData.product.id + 1
                });

            // Check response
            expect(response.status).toBe(400);
            expect(response.body.status).toBe("failure");
            expect(response.body.message).toBe("Product ID mismatch");
        });

        it("should return 400 if the product ID is invalid", async () => {
            // Send request
            const response = await request(app)
                .delete(`/api/v1/products/delete/invalid-id`)
                .send({
                    id: "invalid-id"
                });

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
});

