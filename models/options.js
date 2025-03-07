export default (sequelize, DataTypes) => {
	const Options = sequelize.define(
		'options', 
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
		Options.belongsTo(models.ingredients, {
			foreignKey: {
                allowNull: false,
            },
			onDelete: "CASCADE",
		});
        Options.belongsToMany(
            models.optionGroups, 
            { 
                through: "optionsToGroups",
				onDelete: "CASCADE",
            }
        );
	};

	return Options;
};