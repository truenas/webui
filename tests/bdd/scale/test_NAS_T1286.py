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
pytestmark = [pytest.mark.debug_test]


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
    assert wait_on_element(driver, 10, xpaths.applications.title)


@then('the Apps page load, click settings, unset pool')
def the_apps_page_load_click_settings_unset_pool(driver):
    """the Apps page load, click settings, unset pool."""
    assert wait_on_element(driver, 20, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 5, xpaths.button.unsetPool, 'clickable')
    driver.find_element_by_xpath(xpaths.button.unsetPool).click()


@then('confirm unset pool and wait')
def confirm_unset_pool_and_wait(driver):
    """confirm unset pool and wait."""
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')
    assert wait_on_element(driver, 10, xpaths.button.unset, 'clickable')
    driver.find_element_by_xpath(xpaths.button.unset).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.configuring)


@then('click setting, reset pool')
def click_setting_reset_pool(driver):
    """click setting, reset pool."""
    assert wait_on_element(driver, 10, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 10, xpaths.button.chossePool, 'clickable')
    driver.find_element_by_xpath(xpaths.button.chossePool).click()
    assert wait_on_element(driver, 7, xpaths.chossePoolForApp.title)
    assert wait_on_element(driver, 5, xpaths.chossePoolForApp.pool_select, 'clickable')
    driver.find_element_by_xpath(xpaths.chossePoolForApp.pool_select).click()
    assert wait_on_element(driver, 7, xpaths.chossePoolForApp.tankPool_option, 'clickable')
    driver.find_element_by_xpath(xpaths.chossePoolForApp.tankPool_option).click()
    assert wait_on_element(driver, 7, xpaths.button.choose, 'clickable')
    driver.find_element_by_xpath(xpaths.button.choose).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.configuring)
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')
