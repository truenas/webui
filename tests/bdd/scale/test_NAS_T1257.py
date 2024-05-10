# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
from pytest_dependency import depends


@scenario('features/NAS-T1257.feature', 'Verify the ssh host key stay the same after reboot')
def test_verify_the_ssh_host_key_stay_the_same_after_reboot(driver):
    """Verify the ssh host key stay the same after reboot."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    #depends(request, ['Setup_SSH'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    elif not wait_on_element(driver, 3, xpaths.button.power, 'clickable'):
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()
        driver.refresh()
        wait_on_element(driver, 3, xpaths.login.user_Input, 'inputable')
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


@when('on the Dashboard, get the ssh host key')
def on_the_dashboard_get_the_ssh_host_key(driver, root_password, nas_ip):
    """on the Dashboard, get the ssh host key."""
    global hostkey_before
    rsc.Verify_The_Dashboard(driver)
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_before = results['output']


@then('click on the power button then Restart')
def click_on_the_power_button_then_restart(driver):
    """click on the power button then Restart."""
    assert wait_on_element(driver, 10, xpaths.button.power, 'clickable')
    driver.find_element_by_xpath(xpaths.button.power).click()
    assert wait_on_element(driver, 5, xpaths.button.restart, 'clickable')
    driver.find_element_by_xpath(xpaths.button.restart).click()
    assert wait_on_element(driver, 5, '//h1[text()="Restart"]')
    assert wait_on_element(driver, 5, xpaths.checkbox.new_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.ok, 'clickable')
    driver.find_element_by_xpath(xpaths.button.ok).click()


@then('wait for the login UI to come back and login')
def wait_for_the_login_ui_to_come_back_and_login(driver, root_password):
    """wait for the login UI to come back and login."""
    assert wait_on_element_disappear(driver, 15, xpaths.popup.please_Wait)
    time.sleep(10)
    assert wait_on_element(driver, 300, xpaths.login.user_Input)
    time.sleep(5)
    rsc.Login(driver, 'root', root_password)


@then('on the Dashboard click on Systems Settings then Services')
def on_the_dashboard_click_on_systems_settings_then_services(driver):
    """on the Dashboard click on Systems Settings then Services."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 5, xpaths.side_Menu.services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.services).click()


@then('on the Services page, verify SSH is enabled')
def on_the_services_page_verify_ssh_is_enabled(driver):
    """on the Services page, verify SSH is enabled."""
    assert wait_on_element(driver, 10, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.ssh_edit_button, 'clickable')
    assert attribute_value_exist(driver, xpaths.services.ssh_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')


@then('get the ssh host key again')
def get_the_ssh_host_key_again(driver, root_password, nas_ip):
    """get the ssh host key again."""
    global hostkey_after
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_after = results['output']


@then('verify that both ssh host keys match')
def verify_that_both_ssh_host_keys_match(driver):
    """verify that both ssh host keys match."""
    for line in hostkey_after:
        assert line in hostkey_before
