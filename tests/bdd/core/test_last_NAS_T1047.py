# coding=utf-8
"""CORE feature tests."""

import time
import glob
import os
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1047.feature', 'Verify config backup can be restored')
def test_verify_config_backup_can_be_restored(driver):
    """Verify config backup can be restored."""
    # this run at the and remove the tar file to keep systems clean
    for tar in glob.glob('/tmp/uitest*-TrueNAS-*.tar'):
        os.remove(tar)


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
    else:
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you are on the dashboard')
def you_are_on_the_dashboard(driver):
    """you are on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on the System on the side menu, click on General')
def click_on_the_system_on_the_side_menu_click_on_general(driver):
    """click on the System on the side menu, click on General."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__General"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__General"]').click()


@then('on the General page, click on the Save Config button')
def on_the_general_page_click_on_the_save_config_button(driver):
    """on the General page, click on the Save Config button."""
    assert wait_on_element(driver, 7, '//li[contains(.,"General")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE CONFIG"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE CONFIG"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Save Configuration")]')


@then('click the Export Secret Seed checkbox')
def click_the_export_secret_seed_checkbox(driver):
    """click the Export Secret Seed checkbox."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Export Secret Seed"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Export Secret Seed"]').click()


@then('input the root password testing, then click the Save button')
def input_the_root_password_testing_then_click_the_save_button(driver):
    """input the root password testing, then click the Save button."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Root Password"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Root Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Root Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '(//button[@ix-auto="button__SAVE"])[2]', 'clickable')
    driver.find_element_by_xpath('(//button[@ix-auto="button__SAVE"])[2]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    # this sleep is to make sure the file has time to save
    time.sleep(5)


@then('the file should be saved on the system')
def the_file_should_be_saved_on_the_system(driver, nas_ip, nas_hostname):
    """the file should be saved on the system."""
    global backup_file
    assert glob.glob(f'/tmp/{nas_hostname}-TrueNAS-*.tar')
    backup_file = sorted(glob.glob(f'/tmp/{nas_hostname}-TrueNAS-*.tar'))[-1]


@then('click on the "Reset Config" button, click Confirm, then RESET CONFIG')
def click_on_the_reset_config_button_click_confirm_then_reset_config(driver):
    """click on the "Reset Config" button, click Confirm, then RESET CONFIG."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__RESET CONFIG"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__RESET CONFIG"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Reset Configuration")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Confirm"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm"]').click()
    assert wait_on_element(driver, 7, '(//button[@ix-auto="button__RESET CONFIG"])[2]', 'clickable')
    driver.find_element_by_xpath('(//button[@ix-auto="button__RESET CONFIG"])[2]').click()


@then('the system will reboot, wait the login to come back')
def the_system_will_reboot_wait_the_login_to_come_back(driver):
    """the system will reboot, wait the login to come back."""
    time.sleep(10)
    assert wait_on_element(driver, 300, '//input[@formcontrolname="password"]')
    # this sleep give a little to get ready for more load
    time.sleep(3)


@then('when the system login shows up, input testing1 as the new password')
def when_the_system_login_shows_up_input_testing1_as_the_new_password(driver):
    """when the system login shows up, input testing1 as the new password."""
    assert wait_on_element(driver, 20, '//input[@formcontrolname="password2"]', 'clickable')
    driver.find_element_by_xpath('//input[@formcontrolname="password"]').clear()
    driver.find_element_by_xpath('//input[@formcontrolname="password"]').send_keys('testing1')
    driver.find_element_by_xpath('//input[@formcontrolname="password2"]').clear()
    driver.find_element_by_xpath('//input[@formcontrolname="password2"]').send_keys('testing1')
    assert wait_on_element(driver, 7, '//button[@name="signin_button2"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button2"]').click()


@then('reboot the system and try to login using the previous password testing')
def reboot_the_system_and_try_to_login_using_the_previous_password_testing(driver):
    """reboot the system and try to login using the previous password testing."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__power"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="option__Restart"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="option__Restart"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Restart")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__RESTART"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__RESTART"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    # assert wait_on_element(driver, 30, '//mat-card[contains(.,"System is restarting")]')
    time.sleep(10)
    assert wait_on_element(driver, 300, '//input[@placeholder="Username"]', 'clickable')
    # this sleep give a little to get ready for more load
    time.sleep(3)
    # and look again
    assert wait_on_element(driver, 20, '//input[@placeholder="Password"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('the previous password should fail')
def the_previous_password_should_fail(driver):
    """the previous password should fail."""
    assert wait_on_element(driver, 7, '//span[contains(.,"Please enter your password again")]')


@then('login in using the new password testing1')
def login_in_using_the_new_password_testing1(driver):
    """login in using the new password testing1."""
    assert wait_on_element(driver, 7, '//input[@placeholder="Username"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing1')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('on the General page, click the Upload Config file')
def on_the_general_page_click_the_upload_config_file(driver):
    """on the General page, click the Upload Config file."""
    assert wait_on_element(driver, 7, '//li[contains(.,"General")]')
    time.sleep(1)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__UPLOAD CONFIG"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__UPLOAD CONFIG"]').click()


@then('set the file click Upload')
def set_the_file_click_upload(driver):
    """set the file click Upload."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Upload Config")]')
    assert wait_on_element(driver, 7, '//input[@type="file"]', 'clickable')
    driver.find_element_by_xpath('//input[@type="file"]').send_keys(backup_file)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__UPLOAD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__UPLOAD"]').click()


@then('the system will reboot, wait for the login')
def the_system_will_reboot_wait_for_the_login(driver):
    """the system will reboot, wait for the login."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 300, '//input[@placeholder="Username"]')
    # this sleep give a little to get ready for more load
    time.sleep(3)


@then('try to login using the new password testing1')
def try_to_login_using_the_new_password_testing1(driver):
    """try to login using the new password testing1."""
    assert wait_on_element(driver, 20, '//input[@placeholder="Password"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing1')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('the new password should fail')
def the_new_password_should_fail(driver):
    """the new password should fail."""
    assert wait_on_element(driver, 7, '//span[contains(.,"Please enter your password again")]')


@then('login using the original password testing')
def login_using_the_original_password_testing(driver):
    """login using the original password testing."""
    assert wait_on_element(driver, 7, '//input[@placeholder="Username"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('the original password should work')
def the_original_password_should_work(driver):
    """the original password should work."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
