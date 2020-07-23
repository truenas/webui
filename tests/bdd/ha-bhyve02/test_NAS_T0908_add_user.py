# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

from function import wait_on_element, is_element_present, wait_on_element_disappear
import time
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T908.feature', 'Add User')
def test_add_user_tnbhyve02(driver):
    """Add User."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    wait_on_element(driver, 0.5, 5, 'xpath', '//input[@placeholder="Username"]')
    if is_element_present(driver, 'xpath', '//input[@placeholder="Username"]'):
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//span[contains(.,"System Information")]')


@then('Click on the Accounts item in the left side menu')
def click_on_the_accounts_item_in_the_left_side_menu(driver):
    """Click on the Accounts item in the left side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()


@then('The Accounts menu should expand down')
def the_accounts_menu_should_expand_down(driver):
    """The Accounts menu should expand down."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Users"]')
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
    wait_on_element(driver, 0.5, 5, 'xpath', '//h1[contains(.,"Display Note")]')
    if is_element_present(driver, 'xpath', '//h1[contains(.,"Display Note")]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//div[contains(.,"Users")]')


@then('Click the "Add" Button on the right side of the screen')
def click_the_add_button_on_the_right_side_of_the_screen(driver):
    """Click the "Add" Button on the right side of the screen."""
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('The Users Add Page should open')
def the_users_add_page_should_open(driver):
    """The Users Add Page should open."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h4[contains(.,"Identification")]')
    driver.find_element_by_xpath('//h4[contains(.,"Identification")]')


@then('Fill in the following fields Full Name, Username, Password, Confirm Password and click Save')
def fill_in_the_following_fields_full_name_username_password_confirm_password_and_click_save(driver):
    """Fill in the following fields Full Name, Username, Password, Confirm Password and click Save."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('ericbsd')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('User should be created and added to the user list')
def user_should_be_created_and_added_to_the_user_list(driver):
    """User should be created and added to the user list."""
    wait_on_element_disappear(driver, 1, 30, 'xpath', '//h6[contains(.,"Please wait")]')
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//div[@ix-auto="value__ericbsd_Username"]')
