export default (sequelize, DataTypes) => {
	const Product = sequelize.define(
		'products', 
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
				allowNull: false,
				validate: {
					notEmpty: true,
				},
			},
			photo: {
				type: DataTypes.STRING,
				allowNull: false,
				default: "default.jpg",
				validate: {
					notEmpty: true,
				},
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
                validate: {
                    min: 0,
                },
			}
		}
	);

    Product.associate = (models) => {
        Product.belongsToMany(
            models.ingredients, 
            { 
                through: "ingredientsToProducts",
            }
        );
        Product.belongsToMany(
            models.discounts, 
            { 
                through: "discountsToProducts",
            }
        );
        Product.hasMany(models.optionGroups);
    };

	return Product;
};