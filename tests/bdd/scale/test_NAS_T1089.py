# coding=utf-8
"""SCALE UI feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_for_attribute_value,
    wait_on_element_disappear,
)
from selenium.webdriver.common.keys import (Keys)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1089.feature', 'Add wheel to auxiliary group of a user')
def test_add_wheel_to_auxiliary_group_of_a_user():
    """Add wheel to auxiliary group of a user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User'], scope='session')
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
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_user).click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, xpaths.users.eric_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_edit_button).click()


@then('the User Edit Page should open, add the wheel group and click save')
def the_user_edit_page_should_open_add_the_root_group_and_click_save(driver):
    """the User Edit Page should open, add the wheel group and click save."""
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 7, xpaths.addUser.auxiliaryGroups_select, 'clickable')
    element = driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select)
    # Scroll to wheel
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select).click()
    assert wait_on_element(driver, 7, xpaths.addUser.wheelGroup_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addUser.wheelGroup_option).click()
    driver.find_element_by_xpath(xpaths.addUser.wheelGroup_option).send_keys(Keys.TAB)
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('change should be saved, reopen the edit page, wheel group value should be visible')
def change_should_be_saved_reopen_the_edit_page_wheel_group_value_should_be_visible(driver):
    """change should be saved, reopen the edit page, wheel group value should be visible."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_user, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_user).click()
    assert wait_on_element(driver, 10, xpaths.users.eric_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_edit_button).click()
    assert wait_on_element(driver, 10, xpaths.addUser.edit_title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 7, xpaths.addUser.auxiliaryGroups_select, 'clickable')
    element = driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select)
    # Scroll to wheel
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select).click()
    assert wait_on_element(driver, 7, xpaths.addUser.wheelGroup_option, 'clickable')
    element = driver.find_element_by_xpath('//span[contains(.,"wheel")]')
    # Scroll to wheel
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    wait_for_value = wait_for_attribute_value(driver, 5, xpaths.addUser.wheelGroup_option, 'class', 'mat-selected')
    assert wait_for_value
    # return to dashboard
    driver.find_element_by_xpath(xpaths.addUser.wheelGroup_option).send_keys(Keys.TAB)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, xpaths.button.close_icon, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close_icon).click()
