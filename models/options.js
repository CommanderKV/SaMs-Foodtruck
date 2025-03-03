export default (sequelize, DataTypes) => {
	const Options = sequelize.define(
		'option', 
		{
			priceAdjustment: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
				validate: {
					min: 0,
				},
			},
			multipleChoice: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
                default: true,
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
		}
	);

	Options.associate = (models) => {
		Options.belongsTo(models.ingredient, {
			foreignKey: {
                allowNull: false,
            }
		});
        Options.belongsToMany(
            models.optionGroup, 
            { 
                through: "optionsToGroups",
            }
        );
	};

	return Options;
};