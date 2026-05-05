import jwt from "jsonwebtoken";

const getSecret = () => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}
	return secret;
};

export const signUserToken = (user) => {
	return jwt.sign(
		{
			id: user.id,
			role: user.role ?? "USER",
		},
		getSecret(),
		{ expiresIn: "7d" }
	);
};

export const verifyUserToken = (token) => {
	return jwt.verify(token, getSecret());
};
