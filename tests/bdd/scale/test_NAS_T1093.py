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


@scenario('features/NAS-T1093.feature', 'Disable password for a user')
def test_disable_password_for_a_user():
    """Disable password for a user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
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
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
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


@then('the User Edit Page should open, change "Disable Password" to Yes and click save')
def the_user_edit_page_should_open_change_disable_password_to_yes_and_click_save(driver):
    """the User Edit Page should open, change "Disable Password" to Yes and click save."""
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 3, xpaths.addUser.password_disabled_slide, 'clickable')
    driver.find_element_by_xpath(xpaths.addUser.password_disabled_slide).click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('change should be saved, open the user page and verify the user Disable Password is true')
def change_should_be_saved_open_the_user_page_and_verify_the_user_disable_password_is_true(driver):
    """change should be saved, open the user page and verify the user Disable Password is true."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.users.title)


@then('try login with ssh, the user should not be able to login')
def try_login_with_ssh_the_user_should_not_be_able_to_login(driver, nas_ip):
    """try login with ssh, the user should not be able to login."""
    time.sleep(1)
    # check SSH
    global ssh_result
    ssh_result = ssh_cmd('ls', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result['result'], ssh_result['output']
    assert 'syslog' not in ssh_result['output'], ssh_result['output']
