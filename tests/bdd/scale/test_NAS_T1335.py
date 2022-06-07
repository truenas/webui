# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1335.feature', 'Apps Page - Remove an App')
def test_apps_page__remove_an_app():
    """Apps Page - Remove an App."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()


@then('the Apps page load, open installed applications')
def the_apps_page_load_open_installed_applications(driver):
    """the Apps page load, open installed applications."""
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
        assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')


@then('click the three dots icon and select delete')
def click_the_three_dots_icon_and_select_delete(driver):
    """click the three dots icon and select delete."""
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"collabora")]//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"collabora")]//mat-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 20, '//span[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Delete")]').click()


@then('confirm that you want to delete')
def confirm_that_you_want_to_delete(driver):
    """confirm that you want to delete."""
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('Verify the application has been deleted')
def verify_the_application_has_been_deleted(driver):
    """Verify the application has been deleted."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Deleting...")]')
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Deleting...")]')
    time.sleep(1)  # we have to wait for the page to update
    assert wait_on_element_disappear(driver, 10, '//mat-card[contains(.,"collabora-test")]')
