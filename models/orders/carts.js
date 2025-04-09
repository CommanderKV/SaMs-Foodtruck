export default (sequelize, DataTypes) => {
	const Cart = sequelize.define(
		'carts', 
		{
            orderTotal: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            }
		}
	);

    Cart.associate = (models) => {
        Cart.hasMany(models.productOrders, {
            onDelete: "CASCADE",
        });
        Cart.belongsTo(models.users);
    };

	return Cart;
};