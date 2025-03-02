import { Router } from "express";

const router = Router();
let cart = [];

router.get("/cart", (req, res) => {
	res.json(cart);
});

router.post("/cart", (req, res) => {
	const { itemId, quantity } = req.body;
	const item = menuItems.find((item) => item.id === itemId);
	if (item) {
		cart.push({ ...item, quantity });
		res.status(201).json(cart);
	} else {
		res.status(404).json({ message: "Item not found" });
	}
});

router.delete("/cart/:itemId", (req, res) => {
	const { itemId } = req.params;
	cart = cart.filter((item) => item.id !== parseInt(itemId));
	res.json(cart);
});

export default router;
