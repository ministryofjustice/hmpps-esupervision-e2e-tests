import { Page } from "@playwright/test";
import PractitionerBasePage from "../base/practitionerBasePage";

export enum PhotoOptions {
  TAKE = "TAKE_A_PIC",
  UPLOAD = "UPLOAD_A_PIC",
}

export default class PhotoOptionsPage extends PractitionerBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async completePage(optionId: PhotoOptions) {
    await this.clickRadioByValue("uploadOptions", optionId);
    await this.clickContinue();
  }
}
