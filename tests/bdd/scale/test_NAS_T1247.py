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


@scenario('features/NAS-T1247.feature', 'Verify that full_audit SMB settings dont create tracebck')
def test_verify_that_full_audit_smb_settings_dont_create_tracebck():
    """Verify that full_audit SMB settings dont create tracebck."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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


@when('on the dashboard, click on the System Settings side menu, then click services')
def on_the_dashboard_click_on_the_system_settings_side_menu_then_click_services(driver):
    """on the dashboard, click on the System Settings side menu, then click services."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.services).click()


@then('on the service page, press on configure SMB')
def on_the_service_page_press_on_configure_smb(driver):
    """on the service page, press on configure SMB."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.smb_Service)
    assert wait_on_element(driver, 5, xpaths.services.smb_Service_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.services.smb_Service_Button).click()


@then('the SMB page loads click advanced')
def the_smb_page_loads_click_advanced(driver):
    """the SMB page loads click advanced."""
    if wait_on_element(driver, 3, xpaths.popup.please_Wait):
        assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.smb_Service.title)
    assert wait_on_element(driver, 10, xpaths.button.advanced_Settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_Settings).click()


@then('Enter parameters and click save')
def enter_parameters_and_click_save(driver):
    """Enter parameters and click save."""
    element = driver.find_element_by_xpath(xpaths.button.cancel)
    # Scroll to SSH service
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.smb_Service.auxiliary_Parameters_Textarea, 'inputable')
    auxvariable_str = "vfs objects = full_audit\nfull_audit:success = rename write pwrite unlinkat " \
        "linkat mkdirat\nfull_audit:failure = connect\nfull_audit:prefix = %I|%m|%S"
    driver.find_element_by_xpath(xpaths.smb_Service.auxiliary_Parameters_Textarea).click()
    driver.find_element_by_xpath(xpaths.smb_Service.auxiliary_Parameters_Textarea).send_keys(auxvariable_str)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)


@then('The Service page should load and there should be no traceback')
def the_service_page_should_load_and_there_should_be_no_traceback(driver):
    """The Service page should load and there should be no traceback."""
    assert wait_on_element(driver, 10, xpaths.services.title)
