# coding=utf-8
"""SCALE UI feature tests."""

import time
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


@scenario('features/NAS-T1068.feature', 'Change Shell for user')
def test_change_shell_for_user():
    """Change Shell for user."""


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


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@when('the Users page should open, click the down carat sign right of the users')
def the_users_page_should_open_click_the_down_carat_sign_right_of_the_users(driver):
    """the Users page should open, click the down carat sign right of the users."""
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


@when('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the User Field should expand down, then click the Edit button."""
    #time.sleep(1)
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


@when('the User Edit Page should open, change the user shell and click save')
def the_user_edit_page_should_open_change_the_user_shell_and_click_save(driver):
    """the User Edit Page should open, change the user shell and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//ix-combobox[@formcontrolname="shell"]', 'clickable')
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname="shell"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"zsh")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[span[contains(.,"zsh")]]').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


@then('open the user dropdown, and verify the shell value has changed')
def open_the_user_dropdown_and_verify_the_shell_value_has_changed(driver):
    """open the user dropdown, and verify the shell value has changed."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"zsh")]')
