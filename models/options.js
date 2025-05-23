export default (sequelize, DataTypes) => {
	const Options = sequelize.define(
		'options', 
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
			default: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			}
		},
		{
			timestamps: false,
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