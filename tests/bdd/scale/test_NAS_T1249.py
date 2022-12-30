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
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard click on Storage on the side menu')
def on_the_dashboard_click_on_storage_on_the_side_menu(driver):
    """on the Dashboard click on Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('on the Storage Dashboard click the on Export/Disconnect button of encrypted_pool')
def on_the_storage_dashboard_click_the_on_exportdisconnect_button_of_encrypted_pool(driver):
    """on the Storage Dashboard click the on Export/Disconnect button of encrypted_pool."""
    assert wait_on_element(driver, 7, xpaths.storage.title)
    assert wait_on_element(driver, 5, xpaths.storage.encryptedPool)
    assert wait_on_element(driver, 5, xpaths.storage.exportDisconnect_button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.exportDisconnect_button).click()


@then('on the Export/disconnect pool box click the Destroy and Confirm checkboxes')
def on_the_exportdisconnect_pool_box_click_the_destroy_and_confirm_checkboxes(driver):
    """on the Export/disconnect pool box click the Destroy and Confirm checkboxes."""
    assert wait_on_element(driver, 7, xpaths.exportDisconnectPool.title)
    assert wait_on_element(driver, 5, xpaths.exportDisconnectPool.destroy_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.exportDisconnectPool.destroy_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.exportDisconnectPool.confirm_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.exportDisconnectPool.confirm_checkbox).click()


@then('enter the pool name to confirm, and click Export/Disconnect')
def enter_the_pool_name_to_confirm_and_click_exportdisconnect(driver):
    """enter the pool name to confirm, and click Export/Disconnect."""
    assert wait_on_element(driver, 5, xpaths.exportDisconnectPool.poolName_input, 'inputable')
    driver.find_element_by_xpath(xpaths.exportDisconnectPool.poolName_input).click()
    # driver.find_element_by_xpath(xpaths.exportDisconnectPool.poolName_input).clear()
    driver.find_element_by_xpath(xpaths.exportDisconnectPool.poolName_input).send_keys("encrypted_pool")
    assert wait_on_element(driver, 5, xpaths.exportDisconnectPool.exportDisconnect_button, 'clickable')
    driver.find_element_by_xpath(xpaths.exportDisconnectPool.exportDisconnect_button).click()
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)


@then('the pool should be removed from the Storage Dashboard')
def the_pool_should_be_removed_from_the_storage_dashboard(driver):
    """the pool should be removed from the Storage Dashboard."""
    assert wait_on_element(driver, 20, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element_disappear(driver, 10, xpaths.storage.encryptedPool)
