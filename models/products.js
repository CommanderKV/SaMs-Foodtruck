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
				defaultValue: "logo.png",
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
				onDelete: "CASCADE",
            }
        );
        Product.belongsToMany(
            models.discounts, 
            { 
                through: "discountsToProducts",
				onDelete: "CASCADE",
            }
        );
		Product.belongsToMany(
			models.categories, 
			{ 
				through: "categoriesToProducts",
				onDelete: "CASCADE",
				timestamps: false,
			}
		);
        Product.hasMany(models.optionGroups, {
			onDelete: "CASCADE",
		});
    };

	return Product;
};