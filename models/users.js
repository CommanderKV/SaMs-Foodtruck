export default (sequelize, DataTypes) => {
	const User = sequelize.define(
		"users", 
		{
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
			displayName: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: true,
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            serviceId: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                validate: {
                    notEmpty: true,
                },
            },
            service: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            role: {
                type: DataTypes.ENUM("admin", "user"),
                defaultValue: "user",
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            }
		}
	);

    User.associate = (models) => {
        User.belongsToMany(models.carts, {
            through: "userCarts",
            onDelete: "CASCADE",
        });
    }

	return User;
};