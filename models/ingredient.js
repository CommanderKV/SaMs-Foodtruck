import { DataTypes } from "sequelize";
import db from "../controllers/dbController.js";

const Ingredient = db.define("ingredient", {
	ingredientID: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	description: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	photo: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	productLink: {
		type: DataTypes.STRING,
		allowNull: true,
	},
});

export default Ingredient;