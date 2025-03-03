import { Router } from "express";
import db from "../models/index.js";

const router = Router();

router.get("/", async (req, res) => {
	try {
		const menuItems = await db.products.findAll();
		res.json(menuItems);
	} catch (error) {
		console.log(`Failed to get menu items ${error}`)
		res.status(500).json({ message: "Failed to retrieve menu items" });
	}
});

export default router;
