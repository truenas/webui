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
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


@then('the User Edit Page should open, change the user email "eturgeon@ixsystems.com" and click save')
def the_user_edit_page_should_open_change_the_user_email_eturgeonixsystemscom_and_click_save(driver):
    """the User Edit Page should open, change the user email "eturgeon@ixsystems.com" and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="email"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').send_keys("eturgeon@ixsystems.com")
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


@then('change should be saved, open the user dropdown, the email value should be visible')
def change_should_be_saved_open_the_user_dropdown_the_email_value_should_be_visible(driver):
    """change should be saved, open the user dropdown, the email value should be visible."""
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    driver.find_element_by_xpath('//div[contains(.,"Email:")]')
