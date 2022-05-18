# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1090.feature', 'Verify auxiliary parameters works for AFP share')
def test_verify_auxilary_parameters_works_for_afp_share(driver):
    """Verify auxiliary parameters works for AFP share."""
    # Stop AFP service some test failes after
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 5, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 5, '//div[@ix-auto="value__AFP"]')
    checkbox_value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__AFP_Start Automatically"]', 'class', 'mat-checkbox-checked')
    if checkbox_value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__AFP_Start Automatically"]').click()
    slider_value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__AFP_Running"]', 'class', 'mat-checked')
    if slider_value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__AFP_Running"]').click()


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    global host
    host = nas_ip
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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pool')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pool(driver):
    """on the dashboard, click on Storage on the side menu, click on Pool."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('click on the system pool three dots button, select Add Dataset')
def click_on_the_system_pool_three_dots_button_select_add_dataset(driver):
    """click on the system pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__system"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__system"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__system_Add Dataset"]').click()


@then('input appleshare has the Name, and click SUBMIT')
def input_appleshare_has_the_name_and_click_submit(driver):
    """input appleshare has the Name, and click SUBMIT."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('appleshare')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the new dataset should create without error')
def the_new_dataset_should_create_without_error(driver):
    """the new dataset should create without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"appleshare")]')


@then('click on Sharing on the side menu and click Apple (AFP)')
def click_on_sharing_on_the_side_menu_and_click_apple_afp(driver):
    """click on Sharing on the side menu and click Apple (AFP)."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Sharing"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Apple Shares (AFP)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apple Shares (AFP)"]').click()


@then('on the Apple Shares page, click Add')
def on_the_apple_shares_page_click_add(driver):
    """on the Apple Shares page, click Add."""
    assert wait_on_element(driver, 5, '//div[contains(.,"AFP (Apple File Protocol)")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__AFP (Apple File Protocol)_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__AFP (Apple File Protocol)_ADD"]').click()


@then('click on CONTINUE WITH AFP SETUP')
def click_on_continue_with_afp_setup(driver):
    """click on CONTINUE WITH AFP SETUP."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Recommendation")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE WITH AFP SETUP"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE WITH AFP SETUP"]').click()


@then('input the apple share dataset as the Path, and a share name')
def input_the_apple_share_dataset_as_the_path_and_a_share_name(driver):
    """input the apple share dataset as the Path, and a share name."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"General Options")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/system/appleshare')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('afpshare')


@then('click SUMMIT, the new share should create without errors')
def click_summit_the_new_share_should_create_without_errors(driver):
    """click SUMMIT, the new share should create without errors."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    if wait_on_element(driver, 3, '//h1[contains(.,"Enable service")]'):
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__ENABLE SERVICE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__ENABLE SERVICE"]').click()
        assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"AFP (Apple File Protocol)")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"afpshare")]')


@then('click on the afp share three dots button, then Edit')
def click_on_the_afp_share_three_dots_button_then_edit(driver):
    """click on the afp share three dots button, then Edit."""
    assert wait_on_element(driver, 5, '//mat-icon[@ix-auto="options__afpshare"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__afpshare"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__edit_Edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__edit_Edit"]').click()


@then('on the Edit page, click on the ADVANCED OPTIONS button')
def on_the_edit_page_click_on_the_advanced_options_button(driver):
    """on the Edit page, click on the ADVANCED OPTIONS button."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Edit")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()


@then(parsers.parse('input "{value}" to the Auxiliary Parameters entry'))
def input_max_connections__1_to_the_auxiliary_parameters_entry(driver, value):
    """Input "max connections = 1" to the Auxiliary Parameters entry."""
    assert wait_on_element(driver, 5, '//textarea[@placeholder="Auxiliary Parameters"]', 'inputable')
    driver.find_element_by_xpath('//textarea[@placeholder="Auxiliary Parameters"]').clear()
    driver.find_element_by_xpath('//textarea[@placeholder="Auxiliary Parameters"]').send_keys(value)


@then('click SAVE, the new share should save without errors')
def click_save_the_new_share_should_save_without_errors(driver):
    """click SAVE, the new share should save without errors."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"AFP (Apple File Protocol)")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"afpshare")]')


@then(parsers.parse('verify "{value}" is in "{path}" file'))
def verify_max_connections__1_is_in_usrlocaletcafpconf_file(driver, value, path):
    """verify "max connections = 1" is in "/usr/local/etc/afp.conf" file."""
    cmd = f'grep -R "{value}" {path}'
    results = ssh_cmd(cmd, 'root', 'testing', host)
    assert results['result'], results['output']
