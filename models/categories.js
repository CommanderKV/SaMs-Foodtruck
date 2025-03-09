export default (sequelize, DataTypes) => {
	const Categories = sequelize.define(
		'categories', 
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true,
				},
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
				validate: {
					notEmpty: true,
				},
			},
		},
		{
			timestamps: false,
		}
	);

    Categories.associate = (models) => {
        Categories.belongsToMany(
            models.products, 
            { 
                through: "categoriesToProducts",
				onDelete: "CASCADE",
				timestamps: false,
            }
        );
    };

	return Categories;
};