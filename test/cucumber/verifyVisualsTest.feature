Feature: Verify the visual of webdriverIO
  Scenario: Check webdriverio page on viewport
    Given I open "baseUrl"
    Then I perform visual regression test on view ports
