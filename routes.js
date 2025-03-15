import { Router } from "express";

const router = Router();

/////////////////////////////////
//  Importing all controllers  //
/////////////////////////////////
import productController from "./controllers/productController.js";
import ingredientController from "./controllers/ingredientController.js";
import categoryController from "./controllers/categoryController.js";
import path from "path";

//////////////////////////////////////////////
//  Bellow are all the routes for this api  //
//////////////////////////////////////////////
const routes = [
    {
        version: "v1",
        routes: [
            {
                path: "products",
                routes: [
                    {
                        path: "",
                        method: "GET",
                        function: productController.getAllProducts
                    },
                    {
                        path: "/:id",
                        method: "GET",
                        function: productController.getProductById
                    },
                    {
                        path: "/create",
                        method: "POST",
                        function: productController.createProduct
                    },
                    {
                        path: "/update",
                        method: "PUT",
                        function: productController.updateProduct
                    },
                    {
                        path: "/update/:id",
                        method: "PUT",
                        function: productController.updateProduct
                    },
                    {
                        path: "/delete",
                        method: "DELETE",
                        function: productController.deleteProduct
                    },
                    {
                        path: "/delete/:id",
                        method: "DELETE",
                        function: productController.deleteProduct
                    },

                    {
                        path: "/:id/categories",
                        method: "POST",
                        function: productController.addCategory
                    },
                    {
                        path: "/:id/categories",
                        method: "DELETE",
                        function: productController.removeCategory
                    },
                    {
                        path: "/:id/optionGroups",
                        method: "POST",
                        function: productController.addOptionGroup
                    },
                    {
                        path: "/:id/optionGroups",
                        method: "DELETE",
                        function: productController.removeOptionGroup
                    },
                    {
                        path: "/:id/ingredients",
                        method: "POST",
                        function: productController.addIngredient
                    },
                    {
                        path: "/:id/ingredients",
                        method: "PUT",
                        function: productController.updateIngredient
                    },
                    {
                        path: "/:id/ingredients",
                        method: "DELETE",
                        function: productController.removeIngredient
                    }
                ]
            },
            {
                path: "ingredients",
                routes: [
                    {
                        path: "",
                        method: "GET",
                        function: ingredientController.getIngredients
                    },
                    {
                        path: "/:id",
                        method: "GET",
                        function: ingredientController.getIngredientById
                    },
                    {
                        path: "/create",
                        method: "POST",
                        function: ingredientController.createIngredient
                    },
                    {
                        path: "/update",
                        method: "PUT",
                        function: ingredientController.updateIngredient
                    },
                    {
                        path: "/update/:id",
                        method: "PUT",
                        function: ingredientController.updateIngredient
                    },
                    {
                        path: "/delete",
                        method: "DELETE",
                        function: ingredientController.deleteIngredient
                    },
                    {
                        path: "/delete/:id",
                        method: "DELETE",
                        function: ingredientController.deleteIngredient
                    }
                ]
            },
            {
                path: "categories",
                routes: [
                    {
                        path: "",
                        method: "GET",
                        function: categoryController.getCategories
                    },
                    {
                        path: "/:id",
                        method: "GET",
                        function: categoryController.getCategoryById
                    },
                    {
                        path: "/create",
                        method: "POST",
                        function: categoryController.createCategory
                    },
                    {
                        path: "/update",
                        method: "PUT",
                        function: categoryController.updateCategory
                    },
                    {
                        path: "/update/:id",
                        method: "PUT",
                        function: categoryController.updateCategory
                    },
                    {
                        path: "/delete",
                        method: "DELETE",
                        function: categoryController.deleteCategory
                    },
                    {
                        path: "/delete/:id",
                        method: "DELETE",
                        function: categoryController.deleteCategory
                    }
                ]
            }
        ]
    }
]

// All routes need to be authenticated TODO: Uncomment in prod
// router.use((req, res, next) => {
//     if (req.session.authenticated) {
//         next();
//     } else {
//         res.status(401).send({ 
//             status: "failed", 
//             message: "Not authenticated" 
//         });
//     }
// });

// Initializing the routes
for (const route of routes) {
    let version = route.version;
    // Go through each controller
    for (const subRoute of route.routes) {
        let controller = subRoute.path;

        // Go through each route
        for (const endpoint of subRoute.routes) {
            let path = `/${version}/${controller}${endpoint.path}`;

            // Add the route
            if (endpoint.method === "GET") {
                router.get(
                    path, 
                    endpoint.function
                );
            } else if (endpoint.method === "POST") {
                router.post(
                    path,
                    endpoint.function
                )
            } else if (endpoint.method === "PUT") {
                router.put(
                    path,
                    endpoint.function
                )
            } else if (endpoint.method === "DELETE") {
                router.delete(
                    path, 
                    endpoint.function
                )
            }
        }
    }
}


export default router;
