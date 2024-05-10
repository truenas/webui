# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
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


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
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


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    rsc.Verify_The_Dashboard(driver)


@then('click on the Credentials on the side menu, click on Local Users')
def click_on_the_credentials_on_the_side_menu_click_on_local_users(driver):
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('click the down caret right of the users, then click the Edit button')
def click_the_down_caret_right_of_the_users(driver):
    """click the down caret right of the users, then click the Edit button."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('click Enable Permit Sudo checkbox and click save')
def click_enable_permit_sudo_Checkbox_and_click_save(driver):
    """click Enable Permit Sudo checkbox and click save."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    rsc.Scroll_To(driver, xpaths.button.save)
    value_exist = attribute_value_exist(driver, xpaths.add_User.sudo_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.add_User.sudo_Checkbox).click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the changes should be saved')
def the_changes_should_be_saved(driver):
    """the changes should be saved."""
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)


@then('open the user dropdown')
def open_the_user_dropdown(driver):
    """open the user dropdown."""
    assert wait_on_element(driver, 7, xpaths.users.title, 'clickable')
    assert wait_on_element(driver, 7, xpaths.users.eric_Allowed_Sudo_Commands)
    element_text = driver.find_element_by_xpath(xpaths.users.eric_Allowed_Sudo_Commands).text
    assert element_text == 'ALL'
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('updated value should be visible')
def updated_value_should_be_visible(driver):
    """updated value should be visible."""
    assert wait_on_element(driver, 5, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    rsc.Scroll_To(driver, xpaths.add_User.sudo_Checkbox)
    assert attribute_value_exist(driver, xpaths.add_User.sudo_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    assert wait_on_element(driver, 5, xpaths.button.close_Icon, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close_Icon).click()


@then('open a shell and run su user to become that user')
def open_a_shell_and_run_su_user_to_become_that_user(driver, nas_ip):
    """open a shell and run su user to become that user."""
    global sudo_results
    cmd = 'sudo ls /var/lib/sudo'
    sudo_results = ssh_sudo(cmd, nas_ip, 'ericbsd', 'testing')


@then('the user should be able to use Sudo')
def the_user_should_be_able_to_use_sudo(driver):
    """the user should be able to use Sudo."""
    assert 'lectured' in sudo_results, str(sudo_results)
