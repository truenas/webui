# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from selenium.common.exceptions import ElementClickInterceptedException
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T947.feature', 'Add User')
def test_add_user(driver):
    """Add User."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    assert wait_on_element(driver, 5, '//input[@data-placeholder="Username"]')
    if is_element_present(driver, '//input[@data-placeholder="Username"]'):
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    if wait_on_element(driver, 2, '//div[contains(.,"Looking for help?")]'):
        try:
            assert wait_on_element(driver, 2, '//button[@ix-auto="button__CLOSE"]', 'clickable')
            driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
        except ElementClickInterceptedException:
            assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
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
    if wait_on_element(driver, 5, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Users")]')
    driver.find_element_by_xpath('//h1[contains(.,"Users")]')


@then('Click the "Add" Button on the right side of the screen')
def click_the_add_button_on_the_right_side_of_the_screen(driver):
    """Click the "Add" Button on the right side of the screen."""
    assert wait_on_element(driver, 2, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('The Users Add Page should open')
def the_users_add_page_should_open(driver):
    """The Users Add Page should open."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add User")]')
    time.sleep(0.5)


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
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('User should be created and added to the user list')
def user_should_be_created_and_added_to_the_user_list(driver):
    """User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//h1[contains(.,"Users")]')
    driver.find_element_by_xpath('//td[contains(.,"ericbsd")]')
