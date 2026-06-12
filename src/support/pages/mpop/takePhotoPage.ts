import { expect, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class TakePhotoPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async takePhoto() {
    const btn = this.page.locator("#take-photo");
    await expect(btn).toBeEnabled({ timeout: 10000 });
    await btn.click();
    btn?.click();
  }

  async completePage() {
    await this.takePhoto();
    await this.clickContinue();
  }
}
