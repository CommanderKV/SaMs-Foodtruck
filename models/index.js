import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';
import process from 'process';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const db = {};

// Get the db connection
let sequelize = new Sequelize(
	process.env.DB_NAME, 
	process.env.DB_USER, 
	process.env.DB_PASS, 
	{
		host: process.env.DB_HOST,
		dialect: process.env.DB_DIALECT,
        dialectOptions: { decimalNumbers: true },
		logging: false,
	}
);

// Get the model files
const modelFiles = fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    });

// Import the models
let models = [];
for (const file of modelFiles) {
    // Convert the file path to a file URL
    const modelPath = path.join(__dirname, file);
    const modelUrl = pathToFileURL(modelPath).href;
    const { default: modelDefiner } = await import(modelUrl);
    const model = modelDefiner(sequelize, DataTypes);
    db[model.name] = model;
	models.push(model.name);
}

console.log(`Loaded models: ${models.join(', ')}`);

// Initialize any associations between models
for (const modelName of Object.keys(db)) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
}

// Return the database connection with the models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
