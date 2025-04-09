export default (sequelize, DataTypes) => {
	const Order = sequelize.define(
		'orders', 
		{
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
            },
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
                allowNull: true,
                validate: {
                    notEmpty: true,
                    isEmail: true,
                },
            },
            phoneNumber: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: true,
                },
            },
            orderTotal: {
                type: DataTypes.FLOAT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            orderStatus: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            }
		}
	);

    Order.associate = (models) => {
        Order.hasMany(models.productOrders, {
            onDelete: "CASCADE",
        });
        Order.belongsTo(models.users);
    };

	return Order;
};