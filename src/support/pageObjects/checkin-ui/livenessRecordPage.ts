import { Locator, Page } from '@playwright/test'
import PopBasePage from './checkinBasePage'
import CheckinBasePage from './checkinBasePage'


export default class LivenessRecordPage extends CheckinBasePage {
  constructor(page: Page) { super(page, 'Verify your identity') }

  simulateCompleteButton(): Locator          { return this.qa('mock-complete') }
  simulateCancelButton(): Locator            { return this.qa('mock-cancel') }
  simulateErrorButton(): Locator             { return this.qa('mock-error') }
  simulateTimeoutButton(): Locator           { return this.qa('mock-timeout') }
  simulateConnectionTimeoutButton(): Locator { return this.qa('mock-connection-timeout') }
  simulateCameraNotFoundButton(): Locator    { return this.qa('mock-default-camera-not-found') }
  simulateCameraAccessButton(): Locator      { return this.qa('mock-camera-access') }
  simulateCameraFramerateButton(): Locator   { return this.qa('mock-camera-framerate') }
  simulateMultipleFacesButton(): Locator     { return this.qa('mock-multiple-faces') }
  simulateMobileLandscapeButton(): Locator   { return this.qa('mock-mobile-landscape') }
}