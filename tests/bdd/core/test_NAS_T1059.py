# coding=utf-8
"""Core feature tests."""

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


@scenario('features/NAS-T1059.feature', 'Verify Anonymous FTP Login Access')
def test_verify_anonymous_ftp_login_access(driver):
    """Verify Anonymous FTP Login Access."""
    # reset FTP options for next test
    assert wait_on_element(driver, 7, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__FTP_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__FTP_Actions"]').click()
    """on the FTP edit page, enable the "Allow Anonymous Login" checkbox."""
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__anonpath"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__anonpath"]').clear()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]').click()
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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then('input ftptest for Name, select Generic as Share Type and click Submit')
def input_ftptest_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input ftptest for Name, select Generic as Share Type and click Submit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('ftptest')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_Generic"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"ftptest")]')


@then('click on the ftptest dataset 3 dots button, select Edit Permissions')
def click_on_the_ftptest_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the ftptest dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__ftptest"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__ftptest"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__ftptest_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__ftptest_Edit Permissions"]').click()


@then('on the Permissions page, set the user and the Group to ftp')
def on_the_permissions_page_set_the_user_and_the_group_to_ftp(driver):
    """on the Permissions page, set the user and the Group to ftp."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('ftp')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__ftp"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('ftp')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__ftp"]')
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


@then('on the FTP edit page, enable the "Allow Anonymous Login" checkbox')
def on_the_ftp_edit_page_enable_the_allow_anonymous_login_checkbox(driver):
    """on the FTP edit page, enable the "Allow Anonymous Login" checkbox."""
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Anonymous Login"]').click()


@then('input the ftptest dataset in the Path entry, then click save')
def input_the_ftptest_dataset_in_the_path_entry_then_click_save(driver):
    """input the ftptest dataset in the Path entry, then click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__anonpath"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__anonpath"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__anonpath"]').send_keys('/mnt/tank/ftptest')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('when on the service page, if the FTP service isn\'t running, start it')
def when_on_the_service_page_if_the_ftp_service_isnt_running_start_it(driver):
    """when on the service page, if the FTP service isn't running, start it."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__FTP_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__FTP_Running"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'clickable')
    wait_for_value = wait_for_attribute_value(driver, 10, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    assert wait_for_value


@then('with wget try to login with the anonymous user it should work')
def with_wget_try_to_login_with_the_anonymous_user_it_should_work(driver, nas_ip):
    """with wget try to login with the anonymous user it should work."""
    results = run_cmd(f'wget --user=anonymous ftp://{nas_ip}')
    assert results['result'], results['output']
