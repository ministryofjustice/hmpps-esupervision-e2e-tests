import { Page } from "@playwright/test";
import ContactPreferencePage from "./contactPreferencePage";
import DateFrequencyPage from "./dateFrequencyPage";
import EligibilityPage from "./eligibilityPage";
import EligiblePage from "./eligiblePage";
import IneligiblePage from "./inEligiblePage";
import OverviewPage from "./overviewPage";
import PartiallyEligiblePage from "./partiallyEligiblePage";
import PhotoMeetRulesPage from "./photoMeetRulesPage";
import PhotoOptionsPage from "./photoOptionsPage";
import TakePhotoPage from "./takePhotoPage";
import UploadPhotoPage from "./uploadPage";
import SpoApprovalPage from "./spoApprovalPage";
import CheckInSummaryPage from "./checkInSummaryPage";
import OutComePage from "./outcomePage";


const INELIGIBLE_HEADING= /[^\s]+ is not eligible to use online check ins/
const PARTIALLY_ELIGIBLE_HEADING= /[^\s]+ is eligible to use online check ins as well as existing face-to-face contact/

export class MpopPages {
  readonly overview: OverviewPage;
  readonly eligibility: EligibilityPage;
  readonly eligible: EligiblePage;
  readonly ineligible: OutComePage;
  readonly partiallyEligible: OutComePage;
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
    this.ineligible = new OutComePage(page,INELIGIBLE_HEADING);
    this.partiallyEligible = new OutComePage(page,PARTIALLY_ELIGIBLE_HEADING);
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
