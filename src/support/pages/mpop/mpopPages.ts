import { Page } from "playwright-core";
import ContactPreferencePage from "./contactPreferencePage";
import DateFrequencyPage from "./dateFrequencyPage";
import EligibilityPage from "./eligibilityPage";
import EligiblePage from "./eligiblePage.";
import IneligiblePage from "./inEligiblePage";
import OverviewPage from "./overviewPage";
import PartiallyEligiblePage from "./partiallyEligiblePage";
import PhotoMeetRulesPage from "./photoMeetRulesPage";
import PhotoOptionsPage from "./photoOptionsPage";
import TakePhotoPage from "./takePhotoPage";
import UploadPhotoPage from "./uploadPage";
import SpoApprovalPage from "./spoApprovalPage";
import CheckInSummaryPage from "./checkInSummaryPage";

export class MpopPages {
  readonly overview: OverviewPage;
  readonly eligibility: EligibilityPage;
  readonly eligible: EligiblePage;
  readonly ineligible: IneligiblePage;
  readonly partiallyEligible: PartiallyEligiblePage;
  readonly spoApproval: SpoApprovalPage;
  readonly dateFrequency: DateFrequencyPage;
  readonly contactPreference: ContactPreferencePage;
  readonly photoOptions: PhotoOptionsPage;
  readonly uploadPhoto: UploadPhotoPage;
  readonly takePhoto: TakePhotoPage;
  readonly photoMeetRules: PhotoMeetRulesPage;
  readonly summary: CheckInSummaryPage;

  constructor(page: Page) {
    this.overview = new OverviewPage(page);
    this.eligibility = new EligibilityPage(page);
    this.eligible = new EligiblePage(page);
    this.ineligible = new IneligiblePage(page);
    this.partiallyEligible = new PartiallyEligiblePage(page);
    this.spoApproval = new SpoApprovalPage(page);
    this.dateFrequency = new DateFrequencyPage(page);
    this.contactPreference = new ContactPreferencePage(page);
    this.photoOptions = new PhotoOptionsPage(page);
    this.uploadPhoto = new UploadPhotoPage(page);
    this.takePhoto = new TakePhotoPage(page);
    this.photoMeetRules = new PhotoMeetRulesPage(page);
    this.summary = new CheckInSummaryPage(page);
  }
}
