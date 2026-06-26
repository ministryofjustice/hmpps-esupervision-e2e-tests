import { existsSync } from "fs";
import dotenv from "dotenv";

export const loadEnv = (): void => {
  const envFile = process.env.ENV ? `.env.${process.env.ENV}` : ".env";

  dotenv.config({
    path: existsSync(envFile) ? envFile : ".env",
    quiet: true,
  });
};
