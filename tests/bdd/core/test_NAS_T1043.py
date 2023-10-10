# coding=utf-8
"""Core feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1043.feature', 'Edit User Full Name')
def test_edit_user_full_name(driver):
    """Edit User Full Name."""
    pass


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        rsc.scroll_To(driver, xpaths.sideMenu.root)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you are on the dashboard')
def you_are_on_the_dashboard(driver):
    """you are on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on the Accounts on the side menu, click on Users')
def click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """click on the Accounts on the side menu, click on Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('on the Users page, click the foo user right arrow')
def on_the_users_page_click_the_foo_user_right_arrow(driver):
    """on the Users page, click the foo user right arrow."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__foo"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__foo"]').click()


@then('when the user field expand down, click the Edit button')
def when_the_user_field_expand_down_click_the_edit_button(driver):
    """when the user field expand down, click the Edit button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_foo"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_foo"]').click()


@then(parsers.parse('on the User Edit Page, change the user Name to {name}'))
def on_the_user_edit_page_change_the_user_name_to_too_foo(driver, name):
    """on the User Edit Page, change the user Name to Too Foo."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Edit")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys(name)


@then('click save change should save without error')
def click_save_change_should_save_without_error(driver):
    """click save change should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('open the foo user dropdown')
def open_the_foo_user_dropdown(driver):
    """open the foo user dropdown."""
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__foo"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__foo"]').click()


@then(parsers.parse('verify the full name changed to {name}'))
def verify_the_full_name_changed_to_too_foo(driver, name):
    """verify the full name changed to Too Foo."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Email:")]')
    assert wait_on_element(driver, 7, f'//span[contains(.,"{name}")]')
