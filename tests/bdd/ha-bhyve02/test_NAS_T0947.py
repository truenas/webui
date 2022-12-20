# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import pytest
import time
import xpaths
from function import (
    wait_on_element,
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


@pytest.mark.dependency(name='First_User')
@scenario('features/NAS-T947.feature', 'Add User')
def test_add_user(driver):
    """Add User."""
    pass


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if wait_on_element(driver, 3, xpaths.login.user_input):
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    if wait_on_element(driver, 2, '//div[contains(.,"Looking for help?")]'):
        try:
            assert wait_on_element(driver, 2, xpaths.button.close, 'clickable')
            driver.find_element_by_xpath(xpaths.button.close).click()
        except ElementClickInterceptedException:
            assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
            pass


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()


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
        assert wait_on_element(driver, 7, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element(driver, 7, '//h1[text()="Users"]')


@then('Click the "Add" Button on the right side of the screen')
def click_the_add_button_on_the_right_side_of_the_screen(driver):
    """Click the "Add" Button on the right side of the screen."""
    assert wait_on_element(driver, 2, '//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Add")]').click()


@then('The Users Add Page should open')
def the_users_add_page_should_open(driver):
    """The Users Add Page should open."""
    assert wait_on_element(driver, 7, '//h3[text()="Add User"]')
    time.sleep(0.5)


@then('Fill in the following fields Full Name, Username, Password, Confirm Password and click Save')
def fill_in_the_following_fields_full_name_username_password_confirm_password_and_click_save(driver):
    """Fill in the following fields Full Name, Username, Password, Confirm Password and click Save."""
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="full_name"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys('ericbsd')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys('testing')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()


@then('User should be created and added to the user list')
def user_should_be_created_and_added_to_the_user_list(driver):
    """User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[text()="Users"]')
    assert wait_on_element(driver, 5, '//td[contains(.,"ericbsd")]')
