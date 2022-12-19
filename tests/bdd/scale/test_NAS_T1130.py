# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
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
)


@pytest.mark.dependency(name='Second_User')
@scenario('features/NAS-T1130.feature', 'Add a second user to test smb share permission')
def test_add_a_second_user_to_test_smb_share_permission():
    """Add a second user to test smb share permission."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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
        assert wait_on_element(driver, 30, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on credentials and local accounts')
def you_should_be_on_the_dashboard_click_on_credentials_and_local_accounts(driver):
    """you should be on the dashboard, click on credentials and local accounts."""
    time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    time.sleep(2)
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@then('the users page should open, click add and the add page will open.')
def the_users_page_should_open_click_add_and_the_add_page_will_open(driver):
    """the users page should open, click add and the add page will open.."""
    time.sleep(3)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()
    time.sleep(1)


@then('Input fullname, username, password, confirmpassword, and click save')
def input_fullname_username_password_confirmpassword_and_click_save(driver):
    """Input fullname, username, password, confirmpassword, and click save."""
    assert wait_on_element(driver, 7, xpaths.addUser.fullName_input)
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).send_keys('FooTest')
    driver.find_element_by_xpath(xpaths.addUser.username_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.username_input).send_keys('foo')
    driver.find_element_by_xpath(xpaths.addUser.password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.password_input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).send_keys('testing')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the new user should be created and added to the user list.')
def the_new_user_should_be_created_and_added_to_the_user_list(driver):
    """the new user should be created and added to the user list.."""
    time.sleep(4)
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, '//div[contains(.,"foo")]')
    # return to dashboard
    time.sleep(2)
    assert wait_on_element(driver, 7, xpaths.users.title)
