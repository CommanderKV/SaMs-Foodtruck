export default (sequelize, DataTypes) => {
	const Customization = sequelize.define(
		'customizations', 
		{
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			}
		}
	);

    Customization.associate = (models) => {
        Customization.belongsTo(models.productOrders);
		Customization.belongsTo(models.ingredients, {
			allowNull: false,
		});
    };

	return Customization;
};