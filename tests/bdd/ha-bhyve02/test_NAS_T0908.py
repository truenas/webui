# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present
)
import time
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T908.feature', 'Add User')
def test_add_user(driver):
    """Add User."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_button).click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    if wait_on_element(driver, 3, xpaths.popupTitle.help):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"System Information")]')


@then('Click on the Accounts item in the left side menu')
def click_on_the_accounts_item_in_the_left_side_menu(driver):
    """Click on the Accounts item in the left side menu."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Accounts"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()


@then('The Accounts menu should expand down')
def the_accounts_menu_should_expand_down(driver):
    """The Accounts menu should expand down."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute


@then('Click on Users')
def click_on_users(driver):
    """Click on Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    if wait_on_element(driver, 5, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('Click the "Add" Button on the right side of the screen')
def click_the_add_button_on_the_right_side_of_the_screen(driver):
    """Click the "Add" Button on the right side of the screen."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('The Users Add Page should open')
def the_users_add_page_should_open(driver):
    """The Users Add Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')


@then('Fill in the following fields Full Name, Username, Password, Confirm Password and click Save')
def fill_in_the_following_fields_full_name_username_password_confirm_password_and_click_save(driver):
    """Fill in the following fields Full Name, Username, Password, Confirm Password and click Save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('ericbsd')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('User should be created and added to the user list')
def user_should_be_created_and_added_to_the_user_list(driver):
    """User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 30, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//div[@ix-auto="value__ericbsd_Username"]')
