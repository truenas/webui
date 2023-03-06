# coding=utf-8
"""SCALE UI: feature tests."""

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


@scenario('features/NAS-T1355.feature', 'Apps Page - Validate removing an app')
def test_apps_page__validate_removing_an_app():
    """Apps Page - Validate removing an app."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_Chia'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.apps).click()


@then('make sure the installed tab is open')
def make_sure_the_installed_tab_is_open(driver):
    """make sure the installed tab is open."""
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, '//mat-spinner')


@then('click three dots icon for Chia and select delete')
def click_three_dots_icon_for_chia_and_select_delete(driver):
    """click three dots icon for Chia and select delete."""
    assert wait_on_element(driver, 60, '//mat-card[contains(.,"chia-test")]//ix-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"chia-test")]//ix-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 10, '//button[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Delete")]').click()


@then('confirm the delete confirmation')
def confirm_the_delete_confirmation(driver):
    """confirm the delete confirmation."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 2, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 10, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, '//*[contains(.,"Deleting...")]')
    assert wait_on_element_disappear(driver, 60, '//*[contains(.,"Deleting...")]')


@then('confirm deletion is successful')
def confirm_deletion_is_successful(driver):
    """confirm deletion is successful."""
    assert is_element_present(driver, '//mat-card[contains(.,"chia-test")]') is False
