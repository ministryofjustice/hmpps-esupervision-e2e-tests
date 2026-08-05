import path from "path";
import process from "process";

export const ROOT_DIR = process.cwd();

export const DASHBOARD_STORAGE_STATE = path.join(
  ROOT_DIR,
  "playwright/.auth/dashboard.json",
);
