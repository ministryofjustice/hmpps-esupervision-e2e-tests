import { Page } from "@playwright/test";
import ContactPreferencePage from "./contactPreferencePage";
import DateFrequencyPage from "./dateFrequencyPage";
import EligibilityPage from "./eligibilityPage";
import EligiblePage from "./eligiblePage";
import OverviewPage from "./overviewPage";
import PhotoMeetRulesPage from "./photoMeetRulesPage";
import PhotoOptionsPage from "./photoOptionsPage";
import TakePhotoPage from "./takePhotoPage";
import UploadPhotoPage from "./uploadPage";
import SpoApprovalPage from "./spoApprovalPage";
import CheckInSummaryPage from "./checkInSummaryPage";
import OutcomePage from "./outcomePage";
import CheckInConfirmationPage from "./checkInConfirmationPage";
import StopCheckInsPage from "./stopCheckInsPage";
import ManageCheckInsPage from "./manageCheckInsPage";
import RationalePage from "./rationalePage";
import ReviewIdentityPage from "./reviewIdentityPage";
import ReviewNotesPage from "./reviewNotesPage";
import ActivityLogPage from "./activityLogPage";
import ReviewedCheckinPage from "./reviewedCheckinPage";
import HowToWriteQuestionsPage from "./howToWriteQuestionsPage";
import AddQuestionsPage from "./addQuestionsPage";
import ChooseQuestionPage from "./chooseQuestionPage";
import QuestionPreviewPage from "./questionPreviewPage";
import EditQuestionPage from "./editQuestionPage";

const INELIGIBLE_HEADING = /[^\s]+ is not eligible to use online check ins/;
const PARTIALLY_ELIGIBLE_HEADING =
  /[^\s]+ is eligible to use online check ins as well as existing face-to-face contact/;

export class MpopPages {
  readonly overview: OverviewPage;
  readonly eligibility: EligibilityPage;
  readonly eligible: EligiblePage;
  readonly rationale: RationalePage;
  readonly ineligible: OutcomePage;
  readonly partiallyEligible: OutcomePage;
  readonly spoApproval: SpoApprovalPage;
  readonly dateFrequency: DateFrequencyPage;
  readonly contactPreference: ContactPreferencePage;
  readonly photoOptions: PhotoOptionsPage;
  readonly uploadPhoto: UploadPhotoPage;
  readonly takePhoto: TakePhotoPage;
  readonly photoMeetRules: PhotoMeetRulesPage;
  readonly summary: CheckInSummaryPage;
  readonly manage: ManageCheckInsPage;
  readonly stop: StopCheckInsPage;
  readonly changeCheckinSettings: DateFrequencyPage;

  readonly howToWriteQuestions: HowToWriteQuestionsPage;
  readonly addQuestions: AddQuestionsPage;
  readonly chooseQuestion: ChooseQuestionPage;
  readonly editQuestion: EditQuestionPage;
  readonly questionPreview: QuestionPreviewPage;

  readonly activityLog: ActivityLogPage;
  readonly reviewIdentity: ReviewIdentityPage;
  readonly reviewNotes: ReviewNotesPage;
  readonly reviewedCheckin: ReviewedCheckinPage;

  readonly restartDateFrequency: DateFrequencyPage;
  readonly restartContactPreference: ContactPreferencePage;
  readonly restartSummary: CheckInSummaryPage;
  readonly restartConfirmation: CheckInConfirmationPage;

  constructor(page: Page) {
    this.overview = new OverviewPage(page);
    this.eligibility = new EligibilityPage(page);
    this.eligible = new EligiblePage(page);
    this.rationale = new RationalePage(page);
    this.ineligible = new OutcomePage(page, INELIGIBLE_HEADING);
    this.partiallyEligible = new OutcomePage(page, PARTIALLY_ELIGIBLE_HEADING);
    this.spoApproval = new SpoApprovalPage(page);
    this.dateFrequency = new DateFrequencyPage(page);
    this.contactPreference = new ContactPreferencePage(page);
    this.photoOptions = new PhotoOptionsPage(page);
    this.uploadPhoto = new UploadPhotoPage(page);
    this.takePhoto = new TakePhotoPage(page);
    this.photoMeetRules = new PhotoMeetRulesPage(page);
    this.summary = new CheckInSummaryPage(page);
    this.manage = new ManageCheckInsPage(page);
    this.stop = new StopCheckInsPage(page);
    this.changeCheckinSettings = new DateFrequencyPage(page, "manage");

    this.howToWriteQuestions = new HowToWriteQuestionsPage(page);
    this.addQuestions = new AddQuestionsPage(page);
    this.chooseQuestion = new ChooseQuestionPage(page);
    this.editQuestion = new EditQuestionPage(page);
    this.questionPreview = new QuestionPreviewPage(page);

    this.activityLog = new ActivityLogPage(page);
    this.reviewIdentity = new ReviewIdentityPage(page);
    this.reviewNotes = new ReviewNotesPage(page);
    this.reviewedCheckin = new ReviewedCheckinPage(page);

    this.restartDateFrequency = new DateFrequencyPage(page, "restart");
    this.restartContactPreference = new ContactPreferencePage(page, true);
    this.restartSummary = new CheckInSummaryPage(page, true);
    this.restartConfirmation = new CheckInConfirmationPage(page, true);
  }
}
