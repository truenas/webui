# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='Setup_SSH')
@scenario('features/NAS-T1665.feature', 'Verify SSH Access with root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with root works."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
    driver.get(f"http://{nas_ip}")
    assert wait_on_element(driver, 10, xpaths.login.user_Input)
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
    assert wait_on_element(driver, 4, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


@when('on the dashboard, verify the Welcome box is loaded, click Close')
def on_the_dashboard_verify_the_welcome_box_is_loaded_click_close(driver):
    """on the dashboard, verify the Welcome box is loaded, click Close."""
    rsc.Verify_The_Dashboard(driver)


@then('click on the Credentials side menu, then click Local Users')
def click_on_the_credentials_side_menu_then_click_local_users(driver):
    """click on the Credentials side menu, then click Local Users."""
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('on the Users page expend root and click Edit')
def on_the_users_page_expend_root_and_click_edit(driver):
    """on the Users page expend root and click Edit."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.root_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.root_User).click()
    assert wait_on_element(driver, 10, xpaths.users.root_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.root_Edit_Button).click()


@then('on Edit User click the "SSH password login enabled" checkbox')
def on_edit_user_click_the_ssh_password_login_enabled_checkbox(driver):
    """on Edit User click the "SSH password login enabled" checkbox."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    rsc.Scroll_To(driver, xpaths.add_User.ssh_Password_Enabled_Checkbox)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Password_Enabled_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.ssh_Password_Enabled_Checkbox).click()


@then('click the Save and go to Services page')
def click_the_save_and_go_to_services_page(driver):
    """click the Save and go to Services page."""
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    rsc.Go_To_Service(driver)


@then('on the service page, click the Start Automatically SSH checkbox')
def on_the_service_page_click_the_Start_Automatically_SSH_checkbox(driver):
    """on the service page, click the Start Automatically SSH checkbox ."""
    assert wait_on_element(driver, 5, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.ssh_Service)
    assert wait_on_element(driver, 5, xpaths.services.ssh_autostart_toggle, 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.services.ssh_autostart_toggle, 'class', 'mat-mdc-slide-toggle-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.ssh_autostart_toggle).click()
        assert wait_on_element_disappear(driver, 30, xpaths.popup.please_Wait)


@then('enable the SSH service the service should start without an error')
def enable_the_ssh_service_the_service_should_start_without_an_error(driver):
    """enable the SSH service the service should start without an error."""
    assert wait_on_element(driver, 5, xpaths.services.ssh_running_toggle, 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.services.ssh_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.ssh_running_toggle).click()
        assert wait_on_element_disappear(driver, 30, xpaths.popup.please_Wait)
    assert wait_for_attribute_value(driver, 20, xpaths.services.ssh_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')


@then('ssh to a NAS with root and the root password should work')
def ssh_to_a_nas_with_root_and_the_root_password_should_work(driver, root_password, nas_ip):
    """ssh to a NAS with root and the root password should work."""
    global ssh_result
    ssh_result = ssh_cmd('ls', 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert 'tdb' in ssh_result['output'], ssh_result['output']
