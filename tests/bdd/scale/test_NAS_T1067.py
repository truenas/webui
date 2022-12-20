# coding=utf-8
"""SCALE UI feature tests."""

import pytest
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@pytest.mark.dependency(name='First_User')
@scenario('features/NAS-T1067.feature', 'Create a new user call ericbsd')
def test_create_a_new_user_call_ericbsd():
    """Create a new user call ericbsd."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on the Accounts on the side menu and click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_and_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu and click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click on the "Add" Button')
def the_users_page_should_open_click_on_the_add_button(driver):
    """the Users page should open, click on the "Add" Button."""
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()


@then('the Users Add Page should open, input the fields Full Name, Username, Password and click Save')
def the_users_add_page_should_open_input_the_fields_full_name_username_password_and_click_save(driver):
    """the Users Add Page should open."""
    assert wait_on_element(driver, 7, xpaths.addUser.title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    """input in the following fields Full Name, Username, and password."""
    assert wait_on_element(driver, 7, xpaths.addUser.fullName_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).send_keys('Eric Turgeon')
    driver.find_element_by_xpath(xpaths.addUser.username_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.username_input).send_keys('ericbsd')
    driver.find_element_by_xpath(xpaths.addUser.password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.password_input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).send_keys('testing')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the new User should be created and added to the user list')
def the_new_user_should_be_created_and_added_to_the_user_list(driver):
    """the new User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user)
