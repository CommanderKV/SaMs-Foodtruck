export default (sequelize, DataTypes) => {
	const Ingredient = sequelize.define(
		'ingredient', 
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
			productLnk: {
				type: DataTypes.STRING,
				allowNull: false,
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
			models.product, 
			{ 
				through: "ingredientsToProducts",
			}
		);
		Ingredient.hasMany(models.option);
	};

	return Ingredient;
};