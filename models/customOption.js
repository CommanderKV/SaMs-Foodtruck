import { on } from "supertest/lib/test";

export default (sequelize, DataTypes) => {
	const CustomOptions = sequelize.define(
		'customOptions', 
		{
			priceAdjustment: {
				type: DataTypes.DECIMAL(10,2),
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false
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
        })
    };

	return Categories;
};