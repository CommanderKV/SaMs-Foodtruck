import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	res.render("base", { title: "Welcome to SaM's Foodtruck" });
});

// Add more routes here as needed

export default router;
