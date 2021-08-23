# coding=utf-8
"""Core UI feature tests."""

import os
import pytest
import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    wait_for_attribute_value,
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


@pytest.fixture(scope='module')
def ssh_key():
    localHome = os.path.expanduser('~')
    dotsshPath = localHome + '/.ssh'
    keyPath = localHome + '/.ssh/ui_test_id_rsa'
    setup_ssh_agent()
    if os.path.isdir(dotsshPath) is False:
        os.makedirs(dotsshPath)
    if os.path.exists(keyPath) is False:
        create_key(keyPath)
    add_ssh_key(keyPath)
    ssh_key_file = open(f'{keyPath}.pub', 'r')
    return ssh_key_file.read().strip()


@scenario('features/NAS-T998.feature', 'Add a ssh key to a user and verify it works')
def test_add_a_ssh_key_to_a_user_and_verify_it_works(driver):
    """Add a ssh key to a user and verify it works."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on the Accounts on the side menu, click on Users')
def click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Accounts"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('the Users page should open')
def the_users_page_should_open(driver):
    """the Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('click the Greater-Than-Sign right of the users')
def click_the_greaterthansign_right_of_the_users(driver):
    """click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('the User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """the User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')


@then('input the public key in the SSH Public Key field, then click save')
def input_the_public_key_in_the_ssh_public_key_field_then_click_save(driver, ssh_key):
    """input the public key in the SSH Public Key field, then click save."""
    assert wait_on_element(driver, 5, '//textarea[@placeholder="SSH Public Key"]', 'inputable')
    driver.find_element_by_xpath('//textarea[@placeholder="SSH Public Key"]').clear()
    driver.find_element_by_xpath('//textarea[@placeholder="SSH Public Key"]').send_keys(ssh_key)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('changes should be saved without an error')
def changes_should_be_saved_without_an_error(driver):
    """changes should be saved without an error."""
    assert wait_on_element_disappear(driver, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="value__ericbsd_Username"]')


@then('reopen the user edit page')
def reopen_the_user_edit_page(driver):
    """reopen the user edit page."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')
    time.sleep(1)


@then('verify the public key save properly')
def verify_the_public_key_save_properly(driver, ssh_key):
    """verify the public key save properly."""
    assert wait_on_element(driver, 5, '//textarea[@placeholder="SSH Public Key"]')
    assert wait_for_attribute_value(driver, 5, '//textarea[@placeholder="SSH Public Key"]', 'value', ssh_key)


@then('try to ssh in with the ssh-key')
def try_to_ssh_in_with_the_sshkey(driver, nas_ip):
    """try to ssh in with the ssh-key."""
    global results
    cmd = 'ls -al'
    results = ssh_cmd(cmd, 'ericbsd', None, nas_ip)
    assert results['result'], results['output']


@then('you should be able to ssh with the ssh-key')
def you_should_be_able_to_ssh_with_the_sshkey(driver):
    """you should be able to ssh with the ssh-key."""
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']
