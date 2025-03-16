export default (sequelize, DataTypes) => {
	const Discount = sequelize.define(
		"discounts", 
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
			priceAdjustment: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				validate: {
					min: 0.01,
				},
			}
		}
	);

    Discount.associate = (models) => {
        Discount.belongsToMany(
            models.products, 
            { 
                through: "discountsToProducts",
				onDelete: "CASCADE",
            }
        );
    };

	return Discount;
};