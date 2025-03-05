import { Router } from "express";

const router = Router();

/////////////////////////////////
//  Importing all controllers  //
/////////////////////////////////
import productController from "./controllers/productController.js";

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
                        path: "/delete",
                        method: "DELETE",
                        function: productController.deleteProduct
                    }
                ]
            }
        ]
    }
]

// Initalizing the routes
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
