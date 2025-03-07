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
		}
	);

    Categories.associate = (models) => {
        Categories.belongsToMany(
            models.products, 
            { 
                through: "categoriesToProducts",
				onDelete: "CASCADE",
            }
        );
    };

	return Categories;
};