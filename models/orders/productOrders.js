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
        ProductOrder.belongsTo(models.orders);
        ProductOrder.belongsTo(models.carts);
        ProductOrder.belongsTo(models.products, {
            allowNull: false,
        });
        ProductOrder.hasMany(models.customizations, {
            onDelete: "CASCADE",
        });
    };

    return ProductOrder;
};