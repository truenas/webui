# coding=utf-8
"""Core UI feature tests."""

import time
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


@scenario('features/NAS-T1111.feature', 'Verify Plugins list')
def test_verify_plugins_list(driver):
    """Verify Plugins list."""
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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on Plugins on the left sidebar')
def on_the_dashboard_click_on_plugins_on_the_left_sidebar(driver):
    """on the Dashboard, click on Plugins on the left sidebar."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Plugins"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Plugins"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Plugins"]')


@then('verify only Asigra, iconik, Minio, Nextcloud, Plex, Plex (Beta), Syncthing, and Tarsnap are listed')
def verify_only_asigra_iconik_minio_nextcloud_plex_plex_beta_syncthing_and_tarsnap_are_listed(driver):
    """verify only Asigra, iconik, Minio, Nextcloud, Plex, Plex (Beta), Syncthing, and Tarsnap are listed."""
    plugins_list = [
        'Asigra Backup',
        'Iconik',
        'Minio',
        'Nextcloud',
        'Plex Media Server',
        'Plex Media Server (Beta)',
        'Syncthing',
        'Tarsnap',
    ]
    assert wait_on_element(driver, 5, '//figcaption[text()="Asigra Backup"]')
    assert wait_on_element(driver, 5, '//figcaption[text()="Tarsnap"]')
    # loop all figcaption html tag and make sure that their text exist in plugins_list
    elements = driver.find_elements_by_xpath('//figcaption')
    for element in elements:
        assert element.text in plugins_list
