# coding=utf-8
"""SCALE UI: feature tests."""

import os
import pytest
import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    setup_ssh_agent,
    create_key,
    add_ssh_key,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
from pytest_dependency import depends

localHome = os.path.expanduser('~')
dotsshPath = localHome + '/.ssh'
keyPath = localHome + '/.ssh/ui_test_id_rsa'

setup_ssh_agent()
if os.path.isdir(dotsshPath) is False:
    os.makedirs(dotsshPath)
if os.path.exists(keyPath) is False:
    create_key(keyPath)
add_ssh_key(keyPath)


@pytest.fixture(scope='module')
def ssh_key():
    ssh_key_file = open(f'{keyPath}.pub', 'r')
    return ssh_key_file.read().strip()


@scenario('features/NAS-T1100.feature', 'Add a ssh key to the root user and verify it works')
def test_add_a_ssh_key_to_a_user_and_verify_it_works():
    """Add a ssh key to the root user and verify it works."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['Setup_SSH'], scope='session')
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


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('the Users page should open, click the Greater-Than-Sign right of the root user')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_root_user(driver):
    """the Users page should open, click the Greater-Than-Sign right of the root user."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.root_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.root_User).click()


@then('the root user Field should expand down, click the Edit button')
def the_root_user_field_should_expand_down_click_the_edit_button(driver):
    """the root user Field should expand down, click the Edit button."""
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, xpaths.users.root_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.root_Edit_Button).click()


@then('the root user Edit Page should open, input the SSH key and click save')
def the_root_user_edit_page_should_open_input_the_ssh_key_and_click_save(driver, ssh_key):
    """the root user Edit Page should open, input the SSH key and click save."""
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Pubkey_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).send_keys(ssh_key)
    assert wait_on_element(driver, 2, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then('reopen the root user edit page and verify sshkey was saved.')
def reopen_the_root_user_edit_page_and_verify_sshkey_was_saved(driver, ssh_key):
    """reopen the root user edit page and verify sshkey was saved."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.root_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.root_Edit_Button).click()
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Pubkey_Textarea, 'inputable')
    assert attribute_value_exist(driver, xpaths.add_User.ssh_Pubkey_Textarea, 'value', ssh_key)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, xpaths.button.close_Icon, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close_Icon).click()


@then('verify that you can ssh with the root user sshkey')
def verify_that_you_can_ssh_with_the_root_user_sshkey(nas_ip):
    """verify that you can ssh with the root user sshkey."""
    global results
    cmd = 'ls -al'
    results = ssh_cmd(cmd, 'root', None, nas_ip)
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']
