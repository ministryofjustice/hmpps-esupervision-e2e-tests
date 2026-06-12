import { Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class TakePhotoPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async takePhoto() {
    await this.page.evaluate(async () => {
      const takePhotoButton = document.getElementById("take-photo");
      takePhotoButton?.removeAttribute("disabled");
      takePhotoButton?.removeAttribute("aria-disabled");
      await this.clickContinue();
    });
  }
}
