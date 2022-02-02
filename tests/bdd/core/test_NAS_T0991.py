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


@scenario('features/NAS-T991.feature', 'Add a home directory to a user')
def test_add_a_home_directory_to_a_user(driver):
    """Add a home directory to a user."""


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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
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


@then('the Users page should open')
def the_users_page_should_open(driver):
    """the Users page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')


@then('click the Greater-Than-Sign right of the users')
def click_the_greaterthansign_right_of_the_users(driver):
    """click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()


@then('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]')
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
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__ericbsd"]')
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ericbsd"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]')
    driver.find_element_by_xpath('//h4[contains(.,"Home directory:")]')


@then('verify that the home directory has changed')
def verify_that_the_home_directory_has_changed(driver):
    """verify that the home directory has changed."""
    driver.find_element_by_xpath('//p[contains(.,"/mnt/tank/ericbsd")]')
