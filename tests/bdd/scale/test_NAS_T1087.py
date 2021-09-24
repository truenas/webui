# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import(
    wait_on_element,
    is_element_present,
    wait_for_attribute_value,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers,
)


@scenario('features/NAS-T1087.feature', 'Add an email to a user')
def test_add_an_email_to_a_user():
    """Add an email to a user."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__ericbsd"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__ericbsd"]/td').click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()

@then('the User Edit Page should open, change the user email "eturgeon@ixsystems.com" and click save')
def the_user_edit_page_should_open_change_the_user_email_eturgeonixsystemscom_and_click_save(driver):
    """the User Edit Page should open, change the user email "eturgeon@ixsystems.com" and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    time.sleep(2)
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Email"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Email"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Email"]').send_keys("eturgeon@ixsystems.com")
    time.sleep(3)
    element = driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

    
    
@then('change should be saved, open the user dropdown, the email value should be visible')
def change_should_be_saved_open_the_user_dropdown_the_email_value_should_be_visible(driver):
    """change should be saved, open the user dropdown, the email value should be visible."""
    wait_on_element_disappear(driver, 1, '//h6[contains(.,"Please wait")]')
    time.sleep(3)
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__ericbsd"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__ericbsd"]/td').click()
    driver.find_element_by_xpath('//h4[contains(.,"Email:")]')
        ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)