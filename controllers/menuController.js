import { Router } from "express";

const router = Router();

// Sample menu items
const menuItems = [
	{ id: 1, name: "Burger", price: 5.99 },
	{ id: 2, name: "Fries", price: 2.99 },
	{ id: 3, name: "Soda", price: 1.99 },
];

router.get("/", (req, res) => {
	res.json(menuItems);
});

export default router;
