# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T991.feature', 'Add a home directory to a user')
def test_add_a_home_directory_to_a_user(driver):
    """Add a home directory to a user."""


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


@then('change the path of the users Home Directory')
def change_the_path_of_the_users_home_directory(driver):
    """change the path of the users Home Directory."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__home"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').send_keys('/mnt/tank/ericbsd')


@then('click save and changes should be saved')
def click_save_and_changes_should_be_saved(driver):
    """click save and changes should be saved."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Users")]')


@then('open the drop-down details pane')
def open_the_dropdown_details_pane(driver):
    """open the drop-down details pane."""
    assert wait_on_element(driver, 5, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Home directory:")]')


@then('verify that the home directory has changed')
def verify_that_the_home_directory_has_changed(driver):
    """verify that the home directory has changed."""
    assert wait_on_element(driver, 5, '//p[contains(.,"/mnt/tank/ericbsd")]')
    time.sleep(1)
