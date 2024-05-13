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
from pytest_dependency import depends


@scenario('features/NAS-T1249.feature', 'Verify a pool can be deleted')
def test_verify_a_dataset_can_be_deleted():
    """Verify a dataset can be deleted."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['encrypted_pool'], scope='session')
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


@when('on the Dashboard click on Storage on the side menu')
def on_the_dashboard_click_on_storage_on_the_side_menu(driver):
    """on the Dashboard click on Storage on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


@then('on the Storage Dashboard click the on Export/Disconnect button of encrypted_pool')
def on_the_storage_dashboard_click_the_on_exportdisconnect_button_of_encrypted_pool(driver):
    """on the Storage Dashboard click the on Export/Disconnect button of encrypted_pool."""
    assert wait_on_element(driver, 7, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.encrypted_Pool)
    assert wait_on_element(driver, 5, xpaths.storage.export_Disconnect_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.export_Disconnect_Button).click()


@then('on the Export/disconnect pool box click the Destroy and Confirm checkboxes')
def on_the_exportdisconnect_pool_box_click_the_destroy_and_confirm_checkboxes(driver):
    """on the Export/disconnect pool box click the Destroy and Confirm checkboxes."""
    assert wait_on_element(driver, 7, xpaths.export_Disconnect_Pool.title)
    # Sometime there is a Please waits popup in the way.we need to make sure it is gone clicking
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.export_Disconnect_Pool.destroy_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.export_Disconnect_Pool.destroy_Checkbox).click()

    driver.find_element_by_xpath(xpaths.export_Disconnect_Pool.confirm_Checkbox).click()


@then('enter the pool name to confirm, and click Export/Disconnect')
def enter_the_pool_name_to_confirm_and_click_exportdisconnect(driver):
    """enter the pool name to confirm, and click Export/Disconnect."""
    assert wait_on_element(driver, 5, xpaths.export_Disconnect_Pool.pool_Name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.export_Disconnect_Pool.pool_Name_Input).click()
    driver.find_element_by_xpath(xpaths.export_Disconnect_Pool.pool_Name_Input).send_keys("encrypted_pool")
    assert wait_on_element(driver, 5, xpaths.export_Disconnect_Pool.export_Disconnect_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.export_Disconnect_Pool.export_Disconnect_Button).click()
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)


@then('the pool should be removed from the Storage Dashboard')
def the_pool_should_be_removed_from_the_storage_dashboard(driver):
    """the pool should be removed from the Storage Dashboard."""
    assert wait_on_element(driver, 20, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element_disappear(driver, 10, xpaths.storage.encrypted_Pool)
