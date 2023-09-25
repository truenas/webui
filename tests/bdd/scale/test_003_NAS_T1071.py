# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    create_Pool
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
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


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


# TODO: when Bluefin is replaced by Cobia the steps below need to be refactor.
@then('when the storage page appears, click Create')
def when_the_storage_page_appears_click_create(driver):
    """when the storage page appears, click Create."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    # assert wait_on_element(driver, 10, xpaths.storage.create_Pool_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.storage.create_Pool_Button).click()


@then('on the Pool Manager page enter tank for pool name,')
def on_the_pool_manager_page_enter_tank_for_pool_name(driver, nas_ip, root_password):
    """on the Pool Manager page enter tank for pool name,."""
    # assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    # assert wait_on_element(driver, 10, xpaths.pool_manager.name_Input, 'inputable')
    # driver.find_element_by_xpath(xpaths.pool_manager.name_Input).send_keys('tank')
    create_Pool(nas_ip, ('root', root_password), 'tank')


@then('select the a disk and press right arrow under Data VDevs')
def select_the_a_disk_and_press_right_arrow_under_data_vdev(driver):
    """select the a disk and press right arrow under data vdev."""
    # assert wait_on_element(driver, 5, xpaths.pool_manager.first_Disk_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.first_Disk_Checkbox).click()
    # assert wait_on_element(driver, 5, xpaths.pool_manager.vdev_Add_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.vdev_Add_Button).click()
    pass


@then('click on the Force checkbox on the warning box')
def click_on_the_force_checkbox_on_the_warning_box(driver):
    # assert wait_on_element(driver, 7, xpaths.pool_manager.force_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.force_Checkbox).click()
    pass


# This is passed since the confirmation box is missing in Cobia
@then('click Confirm checkbox and click CONTINUE')
def click_confirm_checkbox_and_click_continue(driver):
    """click Confirm checkbox and click CONTINUE."""
    # rsc.Confirm_Single_Disk(driver)
    pass


@then('click Create, click on Confirm checkbox and click CREATE POOL')
def click_create_click_on_confirm_checkbox_and_click_create_pool(driver):
    """click Create, click on Confirm checkbox and click CREATE POOL."""
    # assert wait_on_element(driver, 5, xpaths.pool_manager.create_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.create_Button).click()
    # rsc.Confirm_Creating_Pool(driver)
    pass


@then('Create Pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create Pool should appear while the pool is being created."""
    # assert wait_on_element(driver, 10, xpaths.pool_manager.create_Pool_Popup)
    # assert wait_on_element_disappear(driver, 120, xpaths.pool_manager.create_Pool_Popup)
    driver.refresh()
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then('you should be returned to the storage pave verify tank is in the Pools list')
def you_should_be_returned_to_the_storage_pave_verify_tank_is_in_the_pools_list(driver):
    """you should be returned to the storage pave verify tank is in the Pools list."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 7, '//div[contains(.,"tank")]')
