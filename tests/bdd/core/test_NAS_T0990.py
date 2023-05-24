# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver.common.keys import Keys
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


@scenario('features/NAS-T990.feature', 'Add wheel to auxiliary group of a user')
def test_add_wheel_to_auxiliary_group_of_a_user(driver):
    """Add wheel to auxiliary group of a user."""


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


@then('add additional groups wheel and click Save')
def add_additional_groups_wheel_and_click_save(driver):
    """add additional groups wheel and click Save."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Auxiliary Groups"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Auxiliary Groups_wheel"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Auxiliary Groups_wheel"]').click()
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Auxiliary Groups_wheel"]').send_keys(Keys.TAB)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('change should be saved')
def change_should_be_saved(driver):
    """change should be saved."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('reopen the user edit page')
def reopen_the_user_edit_page(driver):
    """reopen the user edit page."""
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')


@then('verify wheel group should be visible')
def verify_wheel_group_should_be_visible(driver):
    """verify wheel group should be visible."""
    assert wait_on_element(driver, 7, '//span[contains(.,"wheel,")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CANCEL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CANCEL"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//div[@id="ericbsd_Username"]')
