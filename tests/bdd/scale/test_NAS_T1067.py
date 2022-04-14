# coding=utf-8
"""SCALE UI feature tests."""

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


@scenario('features/NAS-T1067.feature', 'Create a new user call ericbsd')
def test_create_a_new_user_call_ericbsd():
    """Create a new user call ericbsd."""


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


@when('you should be on the dashboard, click on the Accounts on the side menu and click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_and_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu and click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()

    
@when('the Users page should open, click on the "Add" Button')
def the_users_page_should_open_click_on_the_add_button(driver):
    """the Users page should open, click on the "Add" Button."""
    if is_element_present(driver, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()  
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('the Users Add Page should open, input the fields Full Name, Username, Password and click Save')
def the_users_add_page_should_open_input_the_fields_full_name_username_password_and_click_save(driver):
    """the Users Add Page should open."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    """input in the following fields Full Name, Username, and password."""
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="full_name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys('ericbsd')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys('testing')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


@then('the new User should be created and added to the user list')
def the_new_user_should_be_created_and_added_to_the_user_list(driver):
    """the new User should be created and added to the user list."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"ericbsd")]')
