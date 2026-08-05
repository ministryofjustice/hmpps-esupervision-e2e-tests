import { test as teardown } from "@playwright/test";
import fs from "fs";
import { DASHBOARD_STORAGE_STATE } from "../../support/utils/paths";

teardown("remove dashboard auth state", async () => {
  await fs.promises.rm(DASHBOARD_STORAGE_STATE, { force: true });
});
