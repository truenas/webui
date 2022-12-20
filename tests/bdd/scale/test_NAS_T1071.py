# coding=utf-8
"""SCALE UI feature tests."""

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
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='tank_pool')
@scenario('features/NAS-T1071.feature', 'Create pool with 1 disk')
def test_create_pool_with_1_disk(driver):
    """Create pool with 2 disks."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
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
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('when the storage page appears, click Create')
def when_the_storage_page_appears_click_create(driver):
    """when the storage page appears, click Create."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.create_pool_button).click()


@then('on the Pool Manager page enter tank for pool name,')
def on_the_pool_manager_page_enter_tank_for_pool_name(driver):
    """on the Pool Manager page enter tank for pool name,."""
    assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    assert wait_on_element(driver, 10, xpaths.pool_manager.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.pool_manager.name_input).send_keys('tank')


@then('select the a disk and press right arrow under Data VDevs')
def select_the_a_disk_and_press_right_arrow_under_data_vdev(driver):
    """select the a disk and press right arrow under data vdev."""
    assert wait_on_element(driver, 5, xpaths.pool_manager.firstDisk_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.firstDisk_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.vdevAdd_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.vdevAdd_button).click()


@then('click on the Force checkbox on the warning box')
def click_on_the_force_checkbox_on_the_warning_box(driver):
    assert wait_on_element(driver, 7, xpaths.pool_manager.force_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.force_checkbox).click()


@then('click Confirm checkbox and click CONTINUE')
def click_confirm_checkbox_and_click_continue(driver):
    """click Confirm checkbox and click CONTINUE."""
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('click Create, click on Confirm checkbox and click CREATE POOL')
def click_create_click_on_confirm_checkbox_and_click_create_pool(driver):
    """click Create, click on Confirm checkbox and click CREATE POOL."""
    assert wait_on_element(driver, 5, xpaths.pool_manager.create_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_button).click()
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_pool_button).click()


@then('Create Pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create Pool should appear while the pool is being created."""
    assert wait_on_element(driver, 10, xpaths.pool_manager.create_pool_popup)
    assert wait_on_element_disappear(driver, 120, xpaths.pool_manager.create_pool_popup)
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then('you should be returned to the storage pave verify tank is in the Pools list')
def you_should_be_returned_to_the_storage_pave_verify_tank_is_in_the_pools_list(driver):
    """you should be returned to the storage pave verify tank is in the Pools list."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 7, '//div[contains(.,"tank")]')
