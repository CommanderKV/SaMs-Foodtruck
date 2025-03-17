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
            customerId: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            }
		}
	);

    Cart.associate = (models) => {
        Cart.belongsToMany(models.productOrders, {
            through: "productOrdersToCarts",
            onDelete: "CASCADE",
        });
    };

	return Cart;
};