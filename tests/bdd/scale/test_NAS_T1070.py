# coding=utf-8
"""SCALE UI feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    ssh_sudo,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1070.feature', 'Enable user Permit Sudo')
def test_enable_user_permit_sudo():
    """Enable user Permit Sudo."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the FreeNAS URL and logged in."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
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


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)


@then('click on the Credentials on the side menu, click on Local Users')
def click_on_the_credentials_on_the_side_menu_click_on_local_users(driver):
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@then('click the down caret right of the users, then click the Edit button')
def click_the_down_caret_right_of_the_users(driver):
    """click the down caret right of the users, then click the Edit button."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_user).click()
    assert wait_on_element(driver, 10, xpaths.users.eric_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_edit_button).click()


@then('click Enable Permit Sudo checkbox and click save')
def click_enable_permit_sudo_checkbox_and_click_save(driver):
    """click Enable Permit Sudo checkbox and click save."""
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(5)
    value_exist = attribute_value_exist(driver, xpaths.addUser.sudo_checkbox, 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.addUser.sudo_checkbox).click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the changes should be saved')
def the_changes_should_be_saved(driver):
    """the changes should be saved."""
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@then('open the user dropdown')
def open_the_user_dropdown(driver):
    """open the user dropdown."""
    assert wait_on_element(driver, 7, xpaths.users.title, 'clickable')
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_user).click()
    assert wait_on_element(driver, 7, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Permit Sudo:")]/../dd')
    element_text = driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Permit Sudo:")]/../dd').text
    assert element_text == 'true'
    assert wait_on_element(driver, 10, xpaths.users.eric_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_edit_button).click()


@then('updated value should be visible')
def updated_value_should_be_visible(driver):
    """updated value should be visible."""
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert attribute_value_exist(driver, xpaths.addUser.sudo_checkbox, 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()
    time.sleep(0.5)


@then('open a shell and run su user to become that user')
def open_a_shell_and_run_su_user_to_become_that_user(driver, nas_ip):
    """open a shell and run su user to become that user."""
    global sudo_results
    cmd = 'ls /tmp'
    sudo_results = ssh_sudo(cmd, nas_ip, 'ericbsd', 'testing')


@then('the user should be able to use Sudo')
def the_user_should_be_able_to_use_sudo(driver):
    """the user should be able to use Sudo."""
    assert "collectd-boot" in sudo_results, str(sudo_results)
