import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export enum PhotoOptions {
  TAKE = 0,
  UPLOAD = 1,
}

export default class PhotoOptionsPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async completePage(optionId: PhotoOptions) {
    await this.clickRadioById("uploadOptions", optionId);
    await this.clickContinue();
  }
}
