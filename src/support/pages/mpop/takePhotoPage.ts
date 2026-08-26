import { expect, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class TakePhotoPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async takePhoto() {
    const btn = this.page.locator("#take-photo");
    await expect(btn).toBeEnabled({ timeout: 10000 });
    // Button enables before the video stream has a real frame - wait for that too.
    await this.page.waitForFunction(
      () => {
        const video = document.querySelector<HTMLVideoElement>(
          "#es-photo-capture__video",
        );
        return !!video && video.readyState >= 2 && video.videoWidth > 0;
      },
      { timeout: 10000 },
    );
    // This button captures and submits in one click - wait for navigation, not a Continue click.
    await btn.click();
    await expect(this.page).not.toHaveURL(/take-a-photo/, { timeout: 10000 });
  }

  async completePage() {
    await this.takePhoto();
  }
}
