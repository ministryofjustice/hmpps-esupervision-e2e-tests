import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";
import path from "path";
import { ROOT_DIR } from "../../utils/paths";

const PHOTO_PATH = path.join(ROOT_DIR, "src", "media", "photo.png");

export default class UploadPhotoPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Upload a photo of");
  }

  async completePage() {
    await this.uploadPhoto();
    await this.submit();
  }

  fileUploadInput() {
    return this.page.locator("#photoUpload-input");
  }

  async uploadPhoto() {
    await this.fileUploadInput().setInputFiles(PHOTO_PATH);
  }
}
