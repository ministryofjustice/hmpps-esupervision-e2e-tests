import { expect, Page } from "@playwright/test";
import MPopBasePage from "../base/mpopBasePage";

export default class TakePhotoPage extends MPopBasePage {
  constructor(page: Page) {
    super(page, "Take a photo of");
  }

  async takePhoto() {
    const btn = this.page.locator("#take-photo");
    await expect(btn).toBeEnabled({ timeout: 10000 });
    // The button enables as soon as the camera is granted, before the video
    // stream actually has a frame to capture - clicking that early silently
    // fails to advance, so wait for the stream to have real data first.
    await this.page.waitForFunction(
      () => {
        const video = document.querySelector<HTMLVideoElement>(
          "#es-photo-capture__video",
        );
        return !!video && video.readyState >= 2 && video.videoWidth > 0;
      },
      { timeout: 10000 },
    );
    await btn.click();
    // This button is both the capture and the submit action (it's the same
    // element as data-qa="submit-btn"), so there's no separate Continue to
    // click - just wait for it to navigate off this page.
    await expect(this.page).not.toHaveURL(/take-a-photo/, { timeout: 10000 });
  }

  async completePage() {
    await this.takePhoto();
  }
}
