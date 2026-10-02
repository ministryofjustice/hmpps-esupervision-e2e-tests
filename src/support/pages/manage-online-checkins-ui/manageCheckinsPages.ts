import { Page } from "@playwright/test";
import RestartContactPreferencePage from "./restartContactPreferencePage";
import DateFrequencyPage from "./dateFrequencyPage";
import OverviewPage from "../mpop/overviewPage";
import PhotoMeetRulesPage from "./photoMeetRulesPage";
import PhotoOptionsPage from "./photoOptionsPage";
import TakePhotoPage from "./takePhotoPage";
import UploadPhotoPage from "./uploadPage";
import CheckInSummaryPage from "./checkInSummaryPage";
import CheckInConfirmationPage from "./checkInConfirmationPage";
import StopCheckInsPage from "./stopCheckInsPage";
import ManageCheckInsPage from "./manageCheckInsPage";
import RationalePage from "./rationalePage";
import ReviewIdentityPage from "./reviewIdentityPage";
import ReviewNotesPage from "./reviewNotesPage";
import ActivityLogPage from "../mpop/activityLogPage";
import ReviewedCheckinPage from "./reviewedCheckinPage";
import HowToWriteQuestionsPage from "./howToWriteQuestionsPage";
import AddQuestionsPage from "./addQuestionsPage";
import ChooseQuestionPage from "./chooseQuestionPage";
import QuestionPreviewPage from "./questionPreviewPage";
import EditQuestionPage from "./editQuestionPage";
import Header from "./header";
import Footer from "./footer";
import FeedbackBanner from "./feedbackBanner";
import ContactPreferencePage from "./contactPreferencePage";
import ContactDetailsPage from "./contactDetailsPage";
import EditContactDetailsPage from "./editContactDetailsPage";
import PrimaryNavigation from "./primaryNavigation";
import EligibilityCheckPage from "./eligibilityCheckPage";
import PilotCheckPage from "./pilotCheckPage";
import IsEligiblePage from "./isEligiblePage";
import NotEligiblePage from "./notEligiblePage";
import AccreditedProgrammeApprovalPage from "./accreditedProgrammeApprovalPage";

export class ManageCheckinsPages {
  readonly header: Header;
  readonly feedbackBanner: FeedbackBanner;
  readonly footer: Footer;
  readonly primaryNavigation: PrimaryNavigation;
  readonly contactPreference: ContactPreferencePage;
  readonly contactDetails: ContactDetailsPage;
  readonly editContactDetails: EditContactDetailsPage;
  readonly eligibilityCheck: EligibilityCheckPage;
  readonly pilotCheck: PilotCheckPage;
  readonly isEligible: IsEligiblePage;
  readonly notEligible: NotEligiblePage;
  readonly accreditedProgrammeApproval: AccreditedProgrammeApprovalPage;

  readonly overview: OverviewPage;
  readonly rationale: RationalePage;
  readonly dateFrequency: DateFrequencyPage;
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
  readonly restartContactPreference: RestartContactPreferencePage;
  readonly restartSummary: CheckInSummaryPage;
  readonly restartConfirmation: CheckInConfirmationPage;

  constructor(page: Page) {
    this.header = new Header(page);
    this.feedbackBanner = new FeedbackBanner(page);
    this.footer = new Footer(page);
    this.primaryNavigation = new PrimaryNavigation(page);
    this.contactPreference = new ContactPreferencePage(page);
    this.contactDetails = new ContactDetailsPage(page);
    this.editContactDetails = new EditContactDetailsPage(page);
    this.eligibilityCheck = new EligibilityCheckPage(page);
    this.pilotCheck = new PilotCheckPage(page);
    this.isEligible = new IsEligiblePage(page);
    this.notEligible = new NotEligiblePage(page);
    this.accreditedProgrammeApproval = new AccreditedProgrammeApprovalPage(
      page,
    );

    this.overview = new OverviewPage(page);
    this.rationale = new RationalePage(page);
    this.dateFrequency = new DateFrequencyPage(page);
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
    this.restartContactPreference = new RestartContactPreferencePage(page);
    this.restartSummary = new CheckInSummaryPage(page, true);
    this.restartConfirmation = new CheckInConfirmationPage(page, true);
  }
}
