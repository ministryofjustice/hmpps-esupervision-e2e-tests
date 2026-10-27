import { Locator } from "@playwright/test";
import BasePage from "../base/basePage";

export default class ChatbotPage extends BasePage {
  container(): Locator {
    return this.getByID("chatbot-root");
  }

  launcherButton(): Locator {
    return this.getByID("chatbot-launcher");
  }

  closeButton(): Locator {
    return this.container().getByRole("button", { name: "Close chat" });
  }

  async open(): Promise<void> {
    await this.launcherButton().click();
  }
}
