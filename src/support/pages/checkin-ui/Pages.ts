import { Page } from "@playwright/test";
import AssistancePage from "./assistancePage";
import ConfirmationPage from "./confirmationPage";
import MentalHealthPage from "./mentalHealthPage";
import PersonalDetailsPage from "./personalDetailsPage";
import CheckAnswersPage from "./checkAnswersPage";
import VideoViewPage from "./videoViewPage";
import VideoRecordPage from "./fallbackrecordPage";
import HomePage from "./homePage";
import FallbackInformPage from "./fallbackInformPage";
import LivenessViewPage from "./livenessViewPage";
import LivenessRecordPage from "./livenessRecordPage";

export class Pages {
  readonly homepage: HomePage;
  readonly personalDetails: PersonalDetailsPage;
  readonly mentalHealth: MentalHealthPage;
  readonly assistance: AssistancePage;
  readonly livenessRecord: LivenessRecordPage;
  readonly livenessView: LivenessViewPage;
  readonly fallbackInform: FallbackInformPage;
  readonly fallbackRecord: VideoRecordPage;
  readonly videoView: VideoViewPage;
  readonly checkAnswers: CheckAnswersPage;
  readonly confirmation: ConfirmationPage;

  constructor(page: Page) {
    this.homepage = new HomePage(page);
    this.personalDetails = new PersonalDetailsPage(page);
    this.mentalHealth = new MentalHealthPage(page);
    this.assistance = new AssistancePage(page);
    this.livenessRecord = new LivenessRecordPage(page);
    this.livenessView = new LivenessViewPage(page);
    this.fallbackInform = new FallbackInformPage(page);
    this.fallbackRecord = new VideoRecordPage(page);
    this.videoView = new VideoViewPage(page);
    this.checkAnswers = new CheckAnswersPage(page);
    this.confirmation = new ConfirmationPage(page);
  }
}
