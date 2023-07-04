# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import os
import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    setup_ssh_agent,
    create_key,
    add_ssh_key,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
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


@scenario('features/NAS-T959.feature', 'Adding sshkey to a user and verify it works')
def test_adding_sshkey_to_a_user_and_verify_it_works(driver):
    """Adding sshkey to a user and verify it works."""
    pass


@given(parsers.parse('The browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open, navigate to "{nas_url}"."""
    depends(request, ['First_User', 'Setup_SSH'], scope='session')
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 5, xpaths.login.user_Input)
        time.sleep(1)


@when(parsers.parse('If the login page appears, enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If the login page appears, enter "{user}" and "{password}"."""
    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.local_User, 'clickable')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('On the right side of the table, click the expand arrow for one of the users')
def on_the_right_side_of_the_table_click_the_expand_arrow_for_one_of_the_users(driver):
    """On the right side of the table, click the expand arrow for one of the users."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 5, xpaths.users.eric_Edit_Button, 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, xpaths.add_User.edit_Title)
    assert wait_on_element(driver, 5, xpaths.add_User.identification_Legend)


@then('In the SSH public Key field, paste a public key and save the change')
def in_the_ssh_public_key_field_paste_a_public_key_and_save_the_change(driver, ssh_key):
    """In the SSH public Key field, paste a public key and save the change."""
    assert wait_on_element(driver, 7, xpaths.add_User.authentication_Legend)
    element = driver.find_element_by_xpath(xpaths.add_User.authentication_Legend)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Pubkey_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).send_keys(ssh_key)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Password_Enabled_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.ssh_Password_Enabled_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User)


@then('Reopen the user edit page and ensure that the key was saved')
def reopen_the_user_edit_page_and_ensure_that_the_key_was_saved(driver):
    """Reopen the user edit page and ensure that the key was saved."""
    assert wait_on_element(driver, 7, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 5, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()
    assert wait_on_element(driver, 5, xpaths.add_User.edit_Title)
    assert wait_on_element(driver, 5, xpaths.add_User.identification_Legend)


@then('Public key should be on the user page')
def public_key_should_be_on_user_page(driver, ssh_key):
    """Public key should be on the user page."""
    assert wait_on_element(driver, 7, xpaths.add_User.authentication_Legend)
    element = driver.find_element_by_xpath(xpaths.add_User.authentication_Legend)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.add_User.ssh_Pubkey_Textarea, 'inputable')
    assert attribute_value_exist(driver, xpaths.add_User.ssh_Pubkey_Textarea, 'value', ssh_key)
    assert wait_on_element(driver, 5, xpaths.button.close_Icon, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close_Icon).click()
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User)


@then('Try to ssh in with your sshkey')
def try_to_ssh_in_with_your_sshkey(driver):
    """Try to ssh in with your sshkey."""
    cmd = 'ls -al'
    global results
    results = ssh_cmd(cmd, 'ericbsd', None, host)
    assert results['result'], results['output']


@then('You should be able to ssh with the sshkey')
def you_should_be_able_to_ssh_with_the_sshkey(driver):
    """You should be able to ssh with the sshkey."""
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']
