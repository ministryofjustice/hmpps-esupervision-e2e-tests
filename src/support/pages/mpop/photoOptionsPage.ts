import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export enum PhotoOptions {
  TAKE = 0,
  UPLOAD = 1,
}

export default class PhotoOptionsPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async completePage(optionId: PhotoOptions) {
    await this.clickRadioById("uploadOptions", optionId);
    await this.clickContinue();
  }
}
