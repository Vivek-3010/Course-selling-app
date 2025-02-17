import dotenv from "dotenv";
dotenv.config();

const config = {
    JWT_USER_PASSWORD: process.env.JWT_USER_PASSWORD,
    JWT_ADMIN_PASSWORD: process.env.JWT_ADMIN_PASSWORD
};

export default config;
