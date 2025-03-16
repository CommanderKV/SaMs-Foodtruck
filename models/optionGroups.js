export default (sequelize, DataTypes) => {
	const OptionGroups = sequelize.define(
		'optionGroups', 
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
                default: true,
			},
		},
		{
			timestamps: false,
		}
	);

	OptionGroups.associate = (models) => {
		OptionGroups.belongsTo(models.products, {
			foreignKey: {
                allowNull: false,
            },
            onDelete: "CASCADE",
		});
        OptionGroups.belongsToMany(
            models.options, 
            { 
                through: "optionsToGroups",
                onDelete: "CASCADE",
            }
        );
	};

	return OptionGroups;
};