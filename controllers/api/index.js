import { Router } from "express";

const router = Router();

/* 
*  Response structure
*  Success:
*  {
*      status: "success",
*      data: ...
*  }
*
*  Failure:
*  {
*      status: "failure",
*      message: ...
*  }
*/

// V1 API routes
import productAPI from "./productAPI.js";
router.use("/v1/products", productAPI);

export default router;
