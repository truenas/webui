# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
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
    when,
)


@scenario('features/NAS-T1101.feature', 'Wipe disks not in a pool')
def test_wipe_disks_not_in_a_pool():
    """Wipe disks not in a pool."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
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
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard, click Storage on the side menu')
def on_the_dashboard_click_storage_on_the_side_menu(driver):
    """on the dashboard, click Storage on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


@then('on the Storage Dashboard page, click the Disks button')
def on_the_storage_dashboard_page_click_the_disks_button(driver):
    """on the Storage Dashboard page, click the Disks button."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.disks_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.disks_Button).click()


@then('the Disks page shoule appears')
def the_disks_page_shoule_appears(driver):
    """the Disks page shoule appears,."""
    assert wait_on_element(driver, 7, xpaths.disks.title)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('expand N/A pool disks, click wipe select quick press Wipe and confirm, then close when finished')
def expand_na_pool_disks_click_wipe_select_quick_press_wipe_and_confirm_then_close_when_finished(driver):
    """expand N/A pool disks, click wipe select quick press Wipe and confirm, then close when finished."""
    rsc.Wiped_Unused_Disk(driver)
