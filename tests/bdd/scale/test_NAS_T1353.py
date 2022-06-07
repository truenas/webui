# coding=utf-8
"""SCALE UI: feature tests."""

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


@scenario('features/NAS-T1353.feature', 'Apps Page - Validate  adding TrueCharts')
def test_apps_page__validate__adding_truecharts():
    """Apps Page - Validate  adding TrueCharts."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()


@then('when the Apps page loads, open manage catalogs')
def when_the_apps_page_loads_open_manage_catalogs(driver):
    """when the Apps page loads, open manage catalogs."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Manage Catalogs")]')


@then('click add catalog')
def click_add_catalog(driver):
    """click add catalog."""
    assert wait_on_element(driver, 10, '//div[text()="OFFICIAL"]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add Catalog")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add Catalog")]').click()


@then('fill out the form')
def fill_out_the_form(driver):
    """fill out the form."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Add Catalog")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname = "label"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "label"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "label"]//input').send_keys('truecharts')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname = "repository"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "repository"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "repository"]//input').send_keys('https://github.com/truecharts/catalog')
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()


@then('close confirmation dialog')
def close_confirmation_dialog(driver):
    """close confirmation dialog."""
    assert wait_on_element(driver, 30, '//span[contains(.,"Success")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Close")]').click()


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 900, '//div[text()="TRUECHARTS"]')
