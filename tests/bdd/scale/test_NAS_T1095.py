# coding=utf-8
"""SCALE UI: feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_sudo_exptext
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1095.feature', 'Change the password of a user')
def test_change_the_password_of_a_user():
    """Change the password of a user."""


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


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@when('the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button')
def the_users_page_should_open_click_the_greaterthansign_the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('the User Edit Page should open, change the password in both fields and click save')
def the_user_edit_page_should_open_change_the_password_in_both_fields_and_click_save(driver):
    """the User Edit Page should open, change the password in both fields and click save."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 10, xpaths.add_User.password_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.password_Input).send_keys('testing1234')
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).send_keys('testing1234')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the changes should be saved without an error try to ssh with the old password for that user')
def the_changes_should_be_saved_without_an_error_try_to_ssh_with_the_old_password_for_that_user(driver, nas_ip):
    """the changes should be saved without an error try to ssh with the old password for that user."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 2, xpaths.users.title)


@then('the user should not be able to log in ssh with the old password, then try to ssh with the new password for that user')
def the_user_should_not_be_able_to_log_in_ssh_with_the_old_password_then_try_to_ssh_with_the_new_password_for_that_user(driver, nas_ip):
    """the user should not be able to log in ssh with the old password, then try to ssh with the new password for that user."""
    time.sleep(1)
    assert ssh_sudo_exptext('ls /', nas_ip, 'ericbsd', 'testing', 'Sorry, try again')
    time.sleep(1)
    assert ssh_sudo_exptext('ls /', nas_ip, 'ericbsd', 'testing1234', 'sbin')
