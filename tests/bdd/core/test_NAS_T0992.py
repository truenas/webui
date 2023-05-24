# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T992.feature', 'Disable password for a user')
def test_disable_password_for_a_user():
    """Disable Password for a user."""


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


@then('change "Disable Password" to Yes and click save')
def change_disable_password_to_yes_and_click_save(driver):
    """change "Disable Password" to Yes and click save."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Disable Password"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Disable Password"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Disable Password_Yes"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Disable Password_Yes"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('change should be saved')
def change_should_be_saved(driver):
    """change should be saved."""
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('open the user dropdown')
def open_the_user_dropdown(driver):
    """open the user dropdown."""
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')


@then('verify the user Disable Password is true')
def verify_the_user_disable_password_is_true(driver):
    """verify the user Disable Password is true."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Password Disabled:")]/../div/p')
    element_text = driver.find_element_by_xpath('//h4[contains(.,"Password Disabled:")]/../div/p').text
    assert element_text == 'true'


@then('try login with ssh')
def try_login_with_ssh(driver, nas_ip,):
    """try login with ssh."""
    global ssh_result
    ssh_result = ssh_cmd('beadm list', 'ericbsd', 'testing', nas_ip)


@then('the user should not be able to login')
def the_user_should_not_be_able_to_login(driver):
    """the user should not be able to login."""
    assert not ssh_result['result'], ssh_result['output']
    assert 'default' not in ssh_result['output'], ssh_result['output']
