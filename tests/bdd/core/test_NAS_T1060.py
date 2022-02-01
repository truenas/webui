# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    wait_for_attribute_value,
    run_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1060.feature', 'Verify Local User FTP Login Access')
def test_verify_local_user_ftp_login_access(driver):
    """Verify Local User FTP Login Access."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__FTP_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__FTP_Actions"]').click()
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]', 'clickable')
    if attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]', 'class', 'mat-checkbox-checked'):
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
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
    if is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Accounts"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('on the Users page should open, click on the Add Button')
def on_the_users_page_should_open_click_on_the_add_button(driver):
    """on the Users page should open, click on the Add Button."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('on the Users Add page input FTP User in Full Name entry')
def on_the_users_add_page_input_ftp_user_in_full_name_entry(driver):
    """on the Users Add page input FTP User in Full Name entry."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('FTP User')


@then('input ftpuser in Username entry, input ftptest path for Home Directory')
def input_ftpuser_in_username_entry_input_ftptest_path_for_home_directory(driver):
    """input ftpuser in Username entry, input ftptest path for Home Directory."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('ftpuser')
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').send_keys('/mnt/tank/ftptest')


@then('input testing in Password and Confirm Password entries')
def input_testing_in_password_and_confirm_password_entries(driver):
    """input testing in Password and Confirm Password entries."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')


@then('click SUBMIT, and the new user should be created')
def click_save_and_the_new_user_should_be_created(driver):
    """click SUBMIT, and the new user should be created."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"ftpuser")]')


@then('click on Storage on the side menu, click on Pools')
def click_on_storage_on_the_side_menu_click_on_pools(driver):
    """click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the ftptest dataset 3 dots button, select Edit Permissions')
def click_on_the_ftptest_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the ftptest dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__ftptest"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__ftptest"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__ftptest_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__ftptest_Edit Permissions"]').click()


@then('on the Permissions page, set the user and the Group to ftpuser')
def on_the_permissions_page_set_the_user_and_the_group_to_ftpuser(driver):
    """on the Permissions page, set the user and the Group to ftpuser."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('ftpuser')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__ftpuser"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('ftpuser')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__ftpuser"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"ftptest")]')


@then('click on service on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on service on the side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('on the Service page, click on the FTP pencil')
def on_the_service_page_click_on_the_ftp_pencil(driver):
    """on the Service page, click on the FTP pencil."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__FTP_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__FTP_Actions"]').click()


@then('on the FTP edit page, enable the "Allow Local User Login" checkbox')
def on_the_ftp_edit_page_enable_the_allow_local_user_login_checkbox(driver):
    """on the FTP edit page, enable the "Allow Local User Login" checkbox."""
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Local User Login"]').click()


@then('click Save. All changes should save without error')
def click_save_all_changes_should_save_without_error(driver):
    """click Save. All changes should save without error."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('on the service page, if the FTP service isn\'t running, start it')
def on_the_service_page_if_the_ftp_service_isnt_running_start_it(driver):
    """on the service page, if the FTP service isn't running, start it."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__FTP_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__FTP_Running"]').click()
    wait_for_value = wait_for_attribute_value(driver, 10, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    assert wait_for_value


@then('with wget, verify login work with the ftpuser user and password')
def with_wget_verify_login_work_with_the_ftpuser_user_and_password(driver, nas_ip):
    """with wget, verify login work with the ftpuser user and password."""
    results = run_cmd(f'wget --user=ftpuser --password=testing ftp://{nas_ip}')
    assert results['result'], results['output']


@then('verify login do not work with the ftpuser user and bad password')
def verify_login_do_not_work_with_the_ftpuser_user_and_bad_password(driver, nas_ip):
    """verify login do not work with the ftpuser user and bad password."""
    results = run_cmd(f'wget --user=ftpuser --password=abcd1234 ftp://{nas_ip}')
    assert not results['result'], results['output']
