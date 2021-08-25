# coding=utf-8
"""Core UI feature tests."""

import time
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


@scenario('features/NAS-T986.feature', 'Create a new user call ericbsd')
def test_create_a_new_user_call_ericbsd(driver):
    """Create a new user call ericbsd."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on the Accounts on the side menu, click on Users')
def click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Accounts"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('when the Users page should open, click on the "Add" Button')
def when_the_users_page_should_open_click_on_the_add_button(driver):
    """when the Users page should open, click on the "Add" Button."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    if wait_on_element(driver, 3, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('the Users Add Page should open')
def the_users_add_page_should_open(driver):
    """the Users Add Page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')


@then('input in the following fields Full Name, Username')
def input_in_the_following_fields_full_name_username(driver):
    """input in the following fields Full Name, Username."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('ericbsd')


@then('input Password Confirm Password and click Save')
def input_password_confirm_password_and_click_save(driver):
    """input Password Confirm Password and click Save."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the new User should be created and added to the user list')
def the_new_user_should_be_created_and_added_to_the_user_list(driver):
    """the new User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//div[@ix-auto="value__ericbsd_Username"]')
