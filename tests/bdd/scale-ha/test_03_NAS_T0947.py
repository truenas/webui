# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import reusableSeleniumCode as rsc
import pytest
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear
)

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
def the_browser_is_open_navigate_to_nas_url(driver, nas_vip):
    """The browser is open navigate to "{nas_url}"."""
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    rsc.Verify_The_Dashboard(driver)


@then('Click on the Credentials item in the left side menu')
def click_on_the_credentials_item_in_the_left_side_menu(driver):
    """Click on the Credentials item in the left side menu."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()


@then('The Credentials menu should expand to the right')
def the_credentials_menu_should_expand_to_the_right(driver):
    """The Credentials menu should expand to the right."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.local_User, 'clickable')


@then('Click on Local Users')
def click_on_local_users(driver):
    """Click on Local Users."""
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('The Users page should open')
def the_users_page_should_open(driver):
    """The Users page should open."""
    assert wait_on_element(driver, 7, xpaths.users.title)


@then('Click the "Add" Button on the right side of the screen')
def click_the_add_button_on_the_right_side_of_the_screen(driver):
    """Click the "Add" Button on the right side of the screen."""
    assert wait_on_element(driver, 2, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()


@then('The Users Add Page should open')
def the_users_add_page_should_open(driver):
    """The Users Add Page should open."""
    assert wait_on_element(driver, 7, xpaths.add_User.title)
    time.sleep(0.5)


@then('Fill in the following fields Full Name, Username, Password, Confirm Password and click Save')
def fill_in_the_following_fields_full_name_username_password_confirm_password_and_click_save(driver):
    """Fill in the following fields Full Name, Username, Password, Confirm Password and click Save."""
    assert wait_on_element(driver, 7, xpaths.add_User.full_Name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.full_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.full_Name_Input).send_keys('Eric Turgeon')
    driver.find_element_by_xpath(xpaths.add_User.username_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.username_Input).send_keys('ericbsd')
    driver.find_element_by_xpath(xpaths.add_User.password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.password_Input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).send_keys('testing')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('User should be created and added to the user list')
def user_should_be_created_and_added_to_the_user_list(driver):
    """User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 5, xpaths.users.eric_User)
