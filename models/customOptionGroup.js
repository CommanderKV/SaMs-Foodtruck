export default (sequelize, DataTypes) => {
    const CustomOptionGroup = sequelize.define(
        'customOptionGroups', 
        {
            sectionName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            multipleChoice: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        }
    );

    CustomOptionGroup.associate = (models) => {
        CustomOptionGroup.belongsTo(models.productOrders, {
            foreignKey: {
                allowNull: false,
            },
            onDelete: "CASCADE",
        });
        CustomOptionGroup.belongsToMany(
            models.customOptions, 
            { 
                through: "customOptionsToCustomGroups",
                onDelete: "CASCADE",
            }
        );
    };

    return CustomOptionGroup;
};