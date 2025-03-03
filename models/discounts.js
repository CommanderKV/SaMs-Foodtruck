export default (sequelize, DataTypes) => {
	const Discount = sequelize.define(
		"discount", 
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
                    min: 0,
                },
			}
		}
	);

    Discount.associate = (models) => {
        Discount.belongsToMany(
            models.product, 
            { 
                through: "discountsToProducts",
            }
        );
    };

	return Discount;
};