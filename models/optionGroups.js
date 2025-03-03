export default (sequelize, DataTypes) => {
	const OptionGroups = sequelize.define(
		'optionGroup', 
		{
            sectionName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            }
		}
	);

	OptionGroups.associate = (models) => {
		OptionGroups.belongsTo(models.product);
        OptionGroups.belongsToMany(
            models.option, 
            { 
                through: "optionsToGroups",
            }
        );
	};

	return OptionGroups;
};