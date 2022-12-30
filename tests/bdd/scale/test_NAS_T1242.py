# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
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


@when('on the dashboard, click Storage on the side menu')
def on_the_dashboard_click_storage_on_the_side_menu(driver):
    """on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('on the Storage page click create pool')
def on_the_storage_page_click_create_pool(driver):
    """on the Storage page click create pool."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.create_pool_button).click()


@then('on the Pool Manager enter encrypted_poo for pool name')
def on_the_pool_manager_enter_encrypted_poo_for_pool_name(driver):
    """on the Pool Manager enter encrypted_poo for pool name."""
    assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    assert wait_on_element(driver, 10, xpaths.pool_manager.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.pool_manager.name_input).send_keys('encrypted_pool')


@then('click encryption and confirm popup')
def click_encryption_and_confirm_popup(driver):
    """click encryption and confirm popup."""
    assert wait_on_element(driver, 10, xpaths.pool_manager.encryption_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.encryption_checkbox).click()
    assert wait_on_element(driver, 7, xpaths.popup.warning)
    assert wait_on_element(driver, 10, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__I UNDERSTAND"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I UNDERSTAND"]').click()


@then('click a drive checkbox and press the right arrow')
def click_a_drive_checkbox_and_press_the_right_arrow(driver):
    """click a drive checkbox and press the right arrow."""
    assert wait_on_element(driver, 10, xpaths.pool_manager.firstDisk_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.firstDisk_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.vdevAdd_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.vdevAdd_button).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.force_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.force_checkbox).click()


@then('click create confirm the warning checkbox and click CREATE POOL')
def click_create_confirm_the_warning_checkbox_and_click_create_pool(driver):
    """click create confirm the warning checkbox and click CREATE POOL."""
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.create_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_button).click()
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_pool_button).click()
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 30, '//button[contains(text(),"Done")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Done")]').click()
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then('the pool should appear on the storage page')
def the_pool_should_appear_on_the_storage_page(driver):
    """the pool should appear on the storage page."""
    assert wait_on_element(driver, 7, xpaths.storage.encryptedPool)
