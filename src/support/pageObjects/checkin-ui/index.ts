import { Page } from "playwright/types/test";
import AssistancePage from "./assistancePage";
import ConfirmationPage from "./confirmationPage";
import VideoInformPage from "./livenessInformPage";
import MentalHealthPage from "./mentalHealthPage";
import PersonalDetailsPage from "./personalDetailsPage";
import CheckAnswersPage from "./checkAnswersPage";
import LivenessInformPage from "./livenessInformPage";
import LivenessOutcomePage from "./livenessOutcomePage";
import LivenessRecordPage from "./livenessRecordPage";
import LivenessViewPage from "./livenessViewPage";
import VideoViewPage from "./videoViewPage";
import VideoRecordPage from "./videoRecordPage";
import HomePage from "./homePage";

export class CheckinPages {
  readonly homepage: HomePage;
  readonly personalDetails: PersonalDetailsPage;
  readonly mentalHealth: MentalHealthPage;
  readonly assistance: AssistancePage;
  readonly videoInform: VideoInformPage;
  readonly videoRecord: VideoRecordPage;
  readonly videoView: VideoViewPage;
  readonly checkAnswers: CheckAnswersPage;
  readonly confirmation: ConfirmationPage;

  //Liveness (local requires MOCK_LIVENESS=true)
  readonly livenessInform: LivenessInformPage;

  constructor(page: Page) {
    this.homepage = new HomePage(page);
    this.personalDetails = new PersonalDetailsPage(page);
    this.mentalHealth = new MentalHealthPage(page);
    this.videoInform = new VideoInformPage(page);
    this.videoRecord = new VideoRecordPage(page);
    this.videoView = new VideoViewPage(page);

    this.assistance = new AssistancePage(page);
    this.livenessInform = new LivenessInformPage(page);
    this.checkAnswers = new CheckAnswersPage(page);
    this.confirmation = new ConfirmationPage(page);
  }
}
