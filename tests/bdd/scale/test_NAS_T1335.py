# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
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
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1335.feature', 'Apps Page - Remove an App')
def test_apps_page__remove_an_app():
    """Apps Page - Remove an App."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_Collabora'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.apps).click()


@then('the Apps page load, open installed applications')
def the_apps_page_load_open_installed_applications(driver):
    """the Apps page load, open installed applications."""
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('click the three dots icon and select delete')
def click_the_three_dots_icon_and_select_delete(driver):
    """click the three dots icon and select delete."""
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"collabora")]//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"collabora")]//mat-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 20, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()


@then('confirm that you want to delete')
def confirm_that_you_want_to_delete(driver):
    """confirm that you want to delete."""
    assert wait_on_element(driver, 2, xpaths.checkbox.old_confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
    wait_on_element(driver, 10, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('Verify the application has been deleted')
def verify_the_application_has_been_deleted(driver):
    """Verify the application has been deleted."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Deleting...")]')
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Deleting...")]')
    time.sleep(1)  # we have to wait for the page to update
    assert wait_on_element_disappear(driver, 10, '//mat-card[contains(.,"collabora-test")]')
