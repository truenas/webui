# coding=utf-8
"""Verify the version number, ixsystems link, and copyright year feature tests."""

import time
import datetime
from function import (
    wait_on_element,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1049.feature', 'Verify the version number, ixsystems link, and copyright year')
def test_verify_the_version_number_ixsystems_link_and_copyright_year(driver):
    """Verify the version number, ixsystems link, and copyright year."""
    pass


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
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, verify the System Information Version')
def on_the_dashboard_verify_the_system_information_version(driver, iso_version):
    """on the Dashboard, verify the System Information Version."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 7, '//strong[contains(.,"Version:")]')
    element = driver.find_element_by_xpath('//strong[contains(.,"Version:")]/../div/span')
    assert element.text == iso_version, element.text


@then('verify on the upper right corner system is TrueNAS CORE')
def verify_on_the_upper_right_corner_system_is_truenas_core(driver):
    """verify on the upper right corner system is TrueNAS CORE."""
    element = driver.find_element_by_xpath('//span[@class="copyright-txt"]')
    assert 'TrueNAS CORE' in element.text, element.text


@then('verify the Copywrite year and the company name')
def verify_copywrite_year_and_company_name(driver):
    """verify the Copywrite year and the company name."""
    current_year = str(datetime.date.today().year)
    element = driver.find_element_by_xpath('//span[@class="copyright-txt"]')
    assert current_year in element.text, element.text
    assert 'iXsystems, Inc' in element.text, element.text


@then('verify the company name go to www.ixsystems.com')
def verify_the_company_name_go_to_wwwixsystemscom(driver):
    """verify the company name go to www.ixsystems.com."""
    driver.find_element_by_xpath('//a[@title="iXsystems, Inc."]').click()
    time.sleep(1)
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 7, '//img[contains(@title,"ix_logo")]')
    assert 'www.ixsystems.com' in driver.current_url, driver.current_url
    driver.close()
    driver.switch_to.window(driver.window_handles[0])


@then('click on the Settings icon in the upper right and select About')
def click_on_the_settings_icon_in_the_upper_right_and_select_about(driver):
    """click on the Settings icon in the upper right and select About."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__settings"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__settings"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="option__About"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="option__About"]').click()


@then('on the bottom of the About box, verify TrueNAS CORE exist')
def on_the_bottom_of_the_about_box_verify_truenas_core(driver):
    """on the bottom of the About box, verify TrueNAS CORE exist."""
    element = driver.find_element_by_xpath('//div[@class="copyright-txt"]')
    assert 'TrueNAS CORE' in element.text, element.text


@then('verify the Copywrite year is the current year')
def verify_the_copywrite_year_is_the_current_year(driver):
    """verify the Copywrite year is the current year."""
    current_year = str(datetime.date.today().year)
    element = driver.find_element_by_xpath('//div[@class="copyright-txt"]')
    assert current_year in element.text, element.text


@then('verify iXsystems, Inc goes to www.ixsystems.com')
def verify_ixsystems_goes_to_wwwixsystemscom(driver):
    """verify iXsystems, Inc goes to www.ixsystems.com."""
    element = driver.find_element_by_xpath('//div[@class="copyright-txt"]')
    assert 'iXsystems, Inc' in element.text, element.text
    driver.find_element_by_xpath('//div[@class="copyright-txt"]/a').click()
    time.sleep(1)
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 7, '//img[contains(@title,"ix_logo")]')
    assert 'www.ixsystems.com' in driver.current_url, driver.current_url
    driver.close()
    driver.switch_to.window(driver.window_handles[0])


@then('close the about page')
def close_the_about_page(driver):
    """close the about page."""
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
