# coding=utf-8
"""Core UI feature tests."""

import os
import pytest
import time
from function import (
    wait_on_element,
    wait_on_element_disappear,
    wait_for_attribute_value,
    setup_ssh_agent,
    create_key,
    add_ssh_key,
    ssh_cmd,
    is_element_present
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


@given('the browser is open on the Users page')
def the_browser_is_open_on_the_users_page(driver, nas_ip, root_password):
    """the browser is open on the Users page."""
    if f"{nas_ip}/ui/account/users" not in driver.current_url:
        driver.get(f"http://{nas_ip}/ui/account/users")
        time.sleep(1)
    if wait_on_element(driver, 5, '//input[@placeholder="Username"]'):
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    assert wait_on_element(driver, 7, '//li[contains(.,"Users")]')


@when('users are visible click the Greater-Than-Sign right of the users')
def users_are_visible_click_the_greaterthansign_right_of_the_users(driver):
    """users are visible click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    if is_element_present(driver, '//a[@ix-auto="expander__ericbsd" and contains(@class,"datatable-icon-right")]'):
        driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('the User Edit Page should open')
def the_user_edit_page_should_open(driver):
    """the User Edit Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')
    time.sleep(0.5)


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
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="value__ericbsd_Username"]')


@then('reopen the user edit page')
def reopen_the_user_edit_page(driver):
    """reopen the user edit page."""
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Identification")]')
    time.sleep(1)


@then('verify the public key save properly')
def verify_the_public_key_save_properly(driver, ssh_key):
    """verify the public key save properly."""
    assert wait_on_element(driver, 5, '//textarea[@placeholder="SSH Public Key"]')
    assert wait_for_attribute_value(driver, 5, '//textarea[@placeholder="SSH Public Key"]', 'value', ssh_key)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CANCEL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CANCEL"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')


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
