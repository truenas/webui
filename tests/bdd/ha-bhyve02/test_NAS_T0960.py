# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
import os
import pytest
from function import (
    wait_on_element,
    is_element_present,
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


@scenario('features/NAS-T960.feature', 'Adding sshkey to the root user and verify it works')
def test_adding_sshkey_to_the_root_user_and_verify_it_works(driver):
    """Adding sshkey to the root user and verify it works."""
    pass


@given(parsers.parse('The browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open, navigate to "{nas_url}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 5, '//input[@data-placeholder="Username"]')
        time.sleep(1)


@when(parsers.parse('If the login page appears, enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If the login page appears, enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')


@then('Click on Local Users')
def click_on_localusers(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('On the right side of the table, click the expand arrow for the root user')
def on_the_right_side_of_the_table_click_the_expand_arrow_for_the_root_user(driver):
    """On the right side of the table, click the expand arrow for the root user."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"root")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"root")]/td').click()


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details(driver):
    """The User Field should expand down to list further details."""
    assert wait_on_element(driver, 5, '(//tr[contains(.,"root")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears(driver):
    """Click the Edit button that appears."""
    driver.find_element_by_xpath('(//tr[contains(.,"root")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


@then('The User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """The User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Edit User")]')


@then('In the SSH public Key field, paste a public key and save the change')
def in_the_ssh_public_key_field_paste_a_public_key_and_save_the_change(driver, ssh_key):
    """In the SSH public Key field, paste a public key and save the change."""
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'inputable')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__SSH Public Key"]/div/textarea').clear()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__SSH Public Key"]/div/textarea').send_keys(ssh_key)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Change should be saved')
def change_should_be_saved(driver):
    """Change should be saved."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 7, '//h3[contains(.,"Edit User")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//td[contains(.,"root")]')


@then('Reopen the user edit page and ensure that the key was saved')
def reopen_the_user_edit_page_and_ensure_that_the_key_was_saved(driver):
    """Reopen the user edit page and ensure that the key was saved."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"root")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"root")]/td').click()
    assert wait_on_element(driver, 5, '(//tr[contains(.,"root")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"root")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 5, '//h3[contains(.,"Edit User")]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')
    time.sleep(0.5)


@then('Public key should be on the root user page')
def public_key_should_be_on_the_root_user_page(driver, ssh_key):
    """Public key should be on the root user page."""
    assert wait_on_element(driver, 7, '//h4[contains(text(),"Authentication")]')
    assert wait_on_element(driver, 7, '//label[contains(text(),"SSH Public Key")]')
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'inputable')
    assert attribute_value_exist(driver, '//div[@ix-auto="textarea__SSH Public Key"]/div/textarea', 'value', ssh_key)
    assert wait_on_element(driver, 5, '//mat-icon[contains(.,"cancel")]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[contains(.,"cancel")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//td[contains(.,"root")]')


@then('Try to ssh in with root and your sshkey')
def try_to_ssh_in_with_root_and_your_sshkey(driver):
    """Try to ssh in with root and your sshkey."""
    cmd = 'ls -al'
    global results
    results = ssh_cmd(cmd, 'root', None, host)
    assert results['result'], results['output']


@then('You should be able to ssh with the sshkey')
def you_should_be_able_to_ssh_with_the_sshkey(driver):
    """You should be able to ssh with the sshkey."""
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']
