export default (sequelize, DataTypes) => {
	const Order = sequelize.define(
		'orders', 
		{
			firstName: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true,
				},
			},
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isEmail: true,
                },
            },
            phoneNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            orderDate: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            orderTotal: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            orderStatus: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
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

    Order.associate = (models) => {
        Order.belongsToMany(models.productOrders, {
            through: "productOrdersToOrders",
            onDelete: "CASCADE",
        });
    };

	return Order;
};