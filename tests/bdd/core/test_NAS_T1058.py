# coding=utf-8
"""Core feature tests."""

import glob
import os
import shutil
import tarfile
import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1058.feature', 'Verify textdump contains data in the debug')
def test_verify_textdump_contains_data_in_the_debug(driver):
    """Verify textdump contains data in the debug."""
    # this run at the and remove the dowloaded file and extracted files to keep systems clean
    for tar in glob.glob('/tmp/debug-uitest*-*.tgz'):
        os.remove(tar)
    shutil.rmtree('/tmp/ixdiagnose')


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
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on the System on the side menu, click on Advanced')
def on_the_dashboard_click_on_the_system_on_the_side_menu_click_on_advanced(driver):
    """on the dashboard, click on the System on the side menu, click on Advanced."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Advanced"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Advanced"]').click()


@then('on the Advanced page, click on SAVE DEBUG')
def on_the_advanced_page_click_on_save_debug(driver):
    """on the Advanced page, click on SAVE DEBUG."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Advanced")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE DEBUG"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE DEBUG"]').click()


@then(parsers.parse('on the "{title}" box, click PROCEED'))
def on_the_generate_debug_file_box_click_proceed(driver, title):
    """on the "Generate Debug File" box, click PROCEED."""
    assert wait_on_element(driver, 7, f'//h1[contains(.,"{title}")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__PROCEED"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__PROCEED"]').click()


@then('the system should start creating a debug')
def the_system_should_start_creating_a_debug(driver):
    """the system should start creating a debug."""
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Saving Debug")]')


@then('when the debug tgz is saved and unpack it')
def when_the_debug_tgz_is_saved_and_unpack_it(driver, nas_hostname):
    """when the debug tgz is saved and unpack it."""
    time.sleep(3)
    global backup_file
    assert glob.glob(f'/tmp/debug-{nas_hostname}-*.tgz')
    backup_file = sorted(glob.glob(f'/tmp/debug-{nas_hostname}-*.tgz'))[-1]
    tar = tarfile.open(backup_file)
    tar.extractall('/tmp/')
    tar.close()


@then('verify that ixdiagnose has folders and files')
def verify_that_ixdiagnose_has_folders_and_files(driver):
    """verify that ixdiagnose has folders and files."""
    assert os.path.exists('/tmp/ixdiagnose')
    assert os.listdir('/tmp/ixdiagnose')


@then('verify that logs files contain information')
def verify_that_logs_files_contain_information(driver):
    """verify that logs files contain information."""
    assert os.stat('/tmp/ixdiagnose/log/middlewared.log').st_size != 0
    assert os.stat('/tmp/ixdiagnose/log/console.log').st_size != 0
    assert os.stat('/tmp/ixdiagnose/log/messages').st_size != 0
    assert os.stat('/tmp/ixdiagnose/version').st_size != 0
