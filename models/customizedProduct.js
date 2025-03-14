export default (sequelize, DataTypes) => {
	const CustomizedProduct = sequelize.define(
		'customizedProducts', 
		{
			priceAdjustment: {
				type: DataTypes.DECIMAL(10,2),
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
		},
		{
			timestamps: false,
		}
	);

    CustomizedProduct.associate = (models) => {
        CustomizedProduct.belongsTo(models.ingredients, {
            foreignKey: {
                allowNull: false,
            }
        })
    };

	return CustomizedProduct;
};