export default (sequelize, DataTypes) => {
	const Ingredient = sequelize.define(
		'ingredients', 
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true,
				},
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
				validate: {
					notEmpty: true,
				},
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			photo: {
				type: DataTypes.STRING,
				allowNull: false,
				default: "default.jpg",
				validate: {
					notEmpty: true,
				},
			},
			productLink: {
				type: DataTypes.STRING,
				allowNull: true,
				validate: {
					notEmpty: true,
				},
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			}
		}
	);

	Ingredient.associate = (models) => {
		Ingredient.belongsToMany(
			models.products, 
			{ 
				through: "ingredientsToProducts",
				onDelete: "CASCADE",
			}
		);
		Ingredient.hasMany(models.options, {
			onDelete: "CASCADE",
		});
	};

	return Ingredient;
};