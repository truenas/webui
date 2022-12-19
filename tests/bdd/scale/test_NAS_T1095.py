# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd,
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
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button')
def the_users_page_should_open_click_the_greaterthansign_the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_user).click()
    assert wait_on_element(driver, 10, xpaths.users.eric_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_edit_button).click()


@then('the User Edit Page should open, change the password in both fields and click save')
def the_user_edit_page_should_open_change_the_password_in_both_fields_and_click_save(driver):
    """the User Edit Page should open, change the password in both fields and click save."""
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.addUser.password_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addUser.password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.password_input).send_keys('testing1234')
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).send_keys('testing1234')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the changes should be saved without an error try to ssh with the old password for that user')
def the_changes_should_be_saved_without_an_error_try_to_ssh_with_the_old_password_for_that_user(driver, nas_ip):
    """the changes should be saved without an error try to ssh with the old password for that user."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 2, xpaths.users.title)


@then('the user should not be able to log in ssh with the old password, then try to ssh with the new password for that user')
def the_user_should_not_be_able_to_log_in_ssh_with_the_old_password_then_try_to_ssh_with_the_new_password_for_that_user(driver, nas_ip):
    """the user should not be able to log in ssh with the old password, then try to ssh with the new password for that user."""
    time.sleep(1)
    # check SSH
    global ssh_result1
    ssh_result1 = ssh_cmd('ls /', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result1['result'], ssh_result1['output']
    assert 'home' not in ssh_result1['output'], ssh_result1['output']
    time.sleep(1)
    # check SSH
    global ssh_result2
    ssh_result2 = ssh_cmd('ls /', 'ericbsd', 'testing1234', nas_ip)
    assert ssh_result2['result'], ssh_result2['output']
    assert 'home' in ssh_result2['output'], ssh_result2['output']
