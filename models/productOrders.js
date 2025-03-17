export default (sequelize, DataTypes) => {
    const ProductOrder = sequelize.define(
        'productOrders', 
        {
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    min: 1,
                },
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
        },
        {
            timestamps: false,
        }
    );

    ProductOrder.associate = (models) => {
        ProductOrder.belongsTo(models.orders, {
            through: "productOrdersToOrders",
        });
        ProductOrder.belongsTo(models.carts, {
            through: "productOrdersToCarts",
        });
        ProductOrder.belongsTo(models.products, {
            through: "productOrdersToProducts",
            allowNull: false,
        });
    };

    return ProductOrder;
};