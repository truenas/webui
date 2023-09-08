# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    create_Encrypted_Pool
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@pytest.mark.dependency(name='encrypted_pool')
@scenario('features/NAS-T1242.feature', 'Verify an encrypted pool can be created')
def test_verify_an_encrypted_pool_can_be_created():
    """Verify an encrypted pool can be created."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
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
    assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


# TODO: when Bluefin is replaced by Cobia the steps below need to be refactor.
@then('on the Storage page click create pool')
def on_the_storage_page_click_create_pool(driver):
    """on the Storage page click create pool."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    # assert wait_on_element(driver, 10, xpaths.storage.create_Pool_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.storage.create_Pool_Button).click()


@then('on the Pool Manager enter encrypted_poo for pool name')
def on_the_pool_manager_enter_encrypted_poo_for_pool_name(driver, nas_ip, root_password):
    """on the Pool Manager enter encrypted_poo for pool name."""
    # assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    # assert wait_on_element_disappear(driver, 15, xpaths.popup.please_Wait)
    # assert wait_on_element(driver, 10, xpaths.pool_manager.name_Input, 'inputable')
    # driver.find_element_by_xpath(xpaths.pool_manager.name_Input).send_keys('encrypted_pool')
    create_Encrypted_Pool(nas_ip, ('root', root_password), 'encrypted_pool')


@then('click encryption and confirm popup')
def click_encryption_and_confirm_popup(driver):
    """click encryption and confirm popup."""
    # assert wait_on_element(driver, 10, xpaths.pool_manager.encryption_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.encryption_Checkbox).click()

    # # Encryption warning
    # rsc.Confirm_Warning(driver)


@then('click a drive checkbox and press the right arrow')
def click_a_drive_checkbox_and_press_the_right_arrow(driver):
    """click a drive checkbox and press the right arrow."""
    # assert wait_on_element(driver, 10, xpaths.pool_manager.first_Disk_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.first_Disk_Checkbox).click()
    # assert wait_on_element(driver, 5, xpaths.pool_manager.vdev_Add_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.vdev_Add_Button).click()
    # assert wait_on_element(driver, 7, xpaths.pool_manager.force_Checkbox, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.force_Checkbox).click()


@then('click create confirm the warning checkbox and click CREATE POOL')
def click_create_confirm_the_warning_checkbox_and_click_create_pool(driver):
    """click create confirm the warning checkbox and click CREATE POOL."""
    # rsc.Confirm_Single_Disk(driver)
    # assert wait_on_element(driver, 5, xpaths.pool_manager.create_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.pool_manager.create_Button).click()

    # rsc.Confirm_Creating_Pool(driver)
    # assert wait_on_element(driver, 5, xpaths.pool_manager.create_Pool_Popup)

    # rsc.Encyrpted_Key_Waring(driver)


@then('the pool should appear on the storage page')
def the_pool_should_appear_on_the_storage_page(driver):
    """the pool should appear on the storage page."""
    driver.refresh()
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 15, xpaths.storage.encrypted_Pool)
