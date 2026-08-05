export const DATA_DASHBOARD_PATH = "/v2statistics";
export const REGION_DASHBOARD_PATH = "/v2statistics/region";

export interface DashboardTab {
  name: string;
  path: string;
}

export const TAB_OVERALL: DashboardTab = {
  name: "Overall",
  path: DATA_DASHBOARD_PATH,
};

export const TAB_BY_REGION: DashboardTab = {
  name: "Data by Region",
  path: REGION_DASHBOARD_PATH,
};
