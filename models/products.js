export default (sequelize, DataTypes) => {
	const Product = sequelize.define(
		'product', 
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
            models.ingredient, 
            { 
                through: "ingredientsToProducts",
            }
        );
        Product.belongsToMany(
            models.discount, 
            { 
                through: "discountsToProducts",
            }
        );
        Product.hasMany(models.optionGroup);
    };

	return Product;
};