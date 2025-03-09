export default (sequelize, DataTypes) => {
	const IngredientsToProducts = sequelize.define(
		'ingredientsToProducts', 
		{
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
                validate: {
                    min: 1,
                },
			},
            measurement: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                }
            },
		},
		{
			timestamps: false,
		}
	);

	return IngredientsToProducts;
};