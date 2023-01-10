# coding=utf-8
"""SCALE UI: feature tests."""

import os
import pytest
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    setup_ssh_agent,
    wait_on_element_disappear,
    create_key,
    add_ssh_key,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
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


@scenario('features/NAS-T1099.feature', 'Add a ssh key to a user and verify it works')
def test_add_a_ssh_key_to_a_user_and_verify_it_works():
    """Add a ssh key to a user and verify it works."""


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


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


@then('the User Edit Page should open, input the SSH key and click save')
def the_user_edit_page_should_open_input_the_ssh_key_and_click_save(driver, ssh_key):
    """the User Edit Page should open, input the SSH key and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'inputable')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__SSH Public Key"]/div/textarea').clear()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__SSH Public Key"]/div/textarea').send_keys(ssh_key)
    assert wait_on_element(driver, 2, xpaths.button.save)
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.popup.pleaseWait)


@then('reopen the user edit page and verify sshkey was saved.')
def reopen_the_user_edit_page_and_verify_sshkey_was_saved(driver, ssh_key):
    """reopen the user edit page and verify sshkey was saved.."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'inputable')
    assert attribute_value_exist(driver, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'value', ssh_key)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//*[@id="close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="close-icon"]').click()


@then('Verify that you can ssh with the sshkey')
def verify_that_you_can_ssh_with_the_sshkey(driver, nas_ip):
    """Verify that you can ssh with the sshkey."""
    global results
    cmd = 'ls -al'
    results = ssh_cmd(cmd, 'ericbsd', None, nas_ip)
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']
