export default (sequelize, DataTypes) => {
	const CustomOptions = sequelize.define(
		'customOptions', 
		{
			priceAdjustment: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			defaultQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					min: 0,
				},
			},
			minQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					min: 0,
				},
			},
			maxQuantity: {
				type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                },
			},
		},
		{
			timestamps: false,
		}
	);

	CustomOptions.associate = (models) => {
		CustomOptions.belongsTo(models.ingredients, {
			foreignKey: {
                allowNull: false,
            }
		});
        CustomOptions.belongsToMany(
            models.customOptionGroups, 
            { 
                through: "customOptionsToCustomGroups",
				onDelete: "CASCADE",
            }
        );
	};

	return CustomOptions;
};