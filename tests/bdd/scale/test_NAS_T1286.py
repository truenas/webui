# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
import pytest
from pytest_dependency import depends


@pytest.mark.dependency(name='App_readd_pool')
@scenario('features/NAS-T1286.feature', 'Apps Page remove and readd pool')
def test_apps_page_remove_and_readd_pool():
    """Apps Page remove and readd pool."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_initial_setup'], scope='session')
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
    assert wait_on_element(driver, 10, xpaths.applications.title)


@then('the Apps page load, click settings, unset pool')
def the_apps_page_load_click_settings_unset_pool(driver):
    """the Apps page load, click settings, unset pool."""
    assert wait_on_element(driver, 20, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 5, xpaths.button.unset_Pool, 'clickable')
    driver.find_element_by_xpath(xpaths.button.unset_Pool).click()


@then('confirm unset pool and wait')
def confirm_unset_pool_and_wait(driver):
    """confirm unset pool and wait."""
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')
    assert wait_on_element(driver, 10, xpaths.button.unset, 'clickable')
    driver.find_element_by_xpath(xpaths.button.unset).click()
    assert wait_on_element_disappear(driver, 300, xpaths.popup.configuring)


@then('click setting, reset pool')
def click_setting_reset_pool(driver):
    """click setting, reset pool."""
    assert wait_on_element(driver, 10, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 10, xpaths.button.chosse_Pool, 'clickable')
    driver.find_element_by_xpath(xpaths.button.chosse_Pool).click()
    assert wait_on_element(driver, 7, xpaths.chosse_Pool_For_App.title)
    assert wait_on_element(driver, 5, xpaths.chosse_Pool_For_App.pool_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.chosse_Pool_For_App.pool_Select).click()
    assert wait_on_element(driver, 7, xpaths.chosse_Pool_For_App.tank_Pool_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.chosse_Pool_For_App.tank_Pool_Option).click()
    assert wait_on_element_disappear(driver, 5, xpaths.chosse_Pool_For_App.tank_Pool_Option)
    assert wait_on_element(driver, 7, xpaths.button.choose, 'clickable')
    driver.find_element_by_xpath(xpaths.button.choose).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.configuring)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element_disappear(driver, 5, xpaths.chosse_Pool_For_App.title)
