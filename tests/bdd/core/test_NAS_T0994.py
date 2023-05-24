# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    ssh_cmd,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T994.feature', 'Change the password of a user')
def test_change_the_password_of_a_user(driver):
    """Change the password of a user."""


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


@then('change the password in both fields and click save')
def change_the_password_in_both_fields_and_click_save(driver):
    """change the password in both fields and click save."""
    assert wait_on_element(driver, 7, xpaths.input.password, 'inputable')
    driver.find_element_by_xpath(xpaths.input.password).send_keys('testing1234')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing1234')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('changes should be saved without an error')
def changes_should_be_saved_without_an_error(driver):
    """changes should be saved without an error."""
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('try to ssh with the old password for that user')
def try_to_ssh_with_the_old_password_for_that_user(driver, nas_ip):
    """try to ssh with the old password for that user."""
    global ssh_result
    ssh_result = ssh_cmd('beadm list', 'ericbsd', 'testing', nas_ip)


@then('the user should not be able to log in ssh with the old password')
def the_user_should_not_be_able_to_log_in_ssh_with_the_old_password(driver):
    """the user should not be able to log in ssh with the old password."""
    assert not ssh_result['result'], ssh_result['output']
    assert 'default' not in ssh_result['output'], ssh_result['output']


@then('try to ssh with the new password for that user')
def try_to_ssh_with_the_new_password_for_that_user(driver, nas_ip):
    """try to ssh with the new password for that user."""
    global ssh_result
    ssh_result = ssh_cmd('beadm list', 'ericbsd', 'testing1234', nas_ip)


@then('the user should be able to log in with the new password')
def the_user_should_be_able_to_log_in_with_the_new_password(driver):
    """the user should be able to log in with the new password."""
    assert ssh_result['result'], ssh_result['output']
    assert 'default' in ssh_result['output'], ssh_result['output']
