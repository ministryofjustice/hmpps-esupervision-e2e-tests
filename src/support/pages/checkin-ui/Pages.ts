import { Page } from "@playwright/test";
import AssistancePage from "./assistancePage";
import ConfirmationPage from "./confirmationPage";
import MentalHealthPage from "./mentalHealthPage";
import PersonalDetailsPage from "./personalDetailsPage";
import CheckAnswersPage from "./checkAnswersPage";
import VideoViewPage from "./videoViewPage";
import VideoRecordPage from "./videoRecordPage";
import HomePage from "./homePage";
import VideoInformPage from "./videoInformPage";

export class Pages {
  readonly homepage: HomePage;
  readonly personalDetails: PersonalDetailsPage;
  readonly mentalHealth: MentalHealthPage;
  readonly assistance: AssistancePage;
  readonly videoInform: VideoInformPage;
  readonly videoRecord: VideoRecordPage;
  readonly videoView: VideoViewPage;
  readonly checkAnswers: CheckAnswersPage;
  readonly confirmation: ConfirmationPage;

  constructor(page: Page) {
    this.homepage = new HomePage(page);
    this.personalDetails = new PersonalDetailsPage(page);
    this.mentalHealth = new MentalHealthPage(page);
    this.assistance = new AssistancePage(page);
    this.videoInform = new VideoInformPage(page);
    this.videoRecord = new VideoRecordPage(page);
    this.videoView = new VideoViewPage(page);
    this.checkAnswers = new CheckAnswersPage(page);
    this.confirmation = new ConfirmationPage(page);
  }
}
