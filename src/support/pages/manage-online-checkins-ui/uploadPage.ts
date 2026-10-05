import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";
import path from "path";
import { ROOT_DIR } from "../../utils/paths";

const PHOTO_PATH = path.join(ROOT_DIR, "src", "media", "photo.png");

export default class UploadPhotoPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Upload a photo of");
  }

  async completePage() {
    await this.uploadPhoto();
    await this.clickContinue();
  }

  fileUploadInput() {
    return this.page.locator("#photoUpload-input");
  }

  async uploadPhoto() {
    await this.fileUploadInput().setInputFiles(PHOTO_PATH);
  }
}
