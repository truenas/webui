# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    run_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T1133.feature', 'Create a wheel group smb share and verify only wheel group can send files')
def test_create_a_wheel_group_smb_share_and_verify_only_wheel_group_can_send_files():
    """Create a wheel group smb share and verify only wheel group can send files."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['755_dataset'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('you should be on the dashboard, click on Shares on the side menu')
def you_should_be_on_the_dashboard_click_on_shares_on_the_side_menu(driver):
    """you should be on the dashboard, click on Shares on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Shares page click on the SMB Add button')
def on_the_shares_page_click_on_the_smb_add_button(driver):
    """on the Shares page click on the SMB Add button."""
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smb_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smb_Add_Button).click()


@then(parsers.parse('on the SMB Add set Path to "{path}"'))
def on_the_smb_add_set_path_to_mnttankwheel_dataset(driver, path):
    """on the SMB Add set Path to "/mnt/tank/wheel_dataset"."""
    global dataset_path
    dataset_path = path
    assert wait_on_element(driver, 5, xpaths.smb.addTitle)
    assert wait_on_element(driver, 5, xpaths.smb.path_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_Input).send_keys(path)


@then(parsers.parse('input "{share_name}" as name, click to enable'))
def input_wheelsmbshare_as_name_click_to_enable(driver, share_name):
    """input "wheelsmbshare" as name, Click to enable."""
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys(share_name)
    rsc.set_checkbox(driver, xpaths.checkbox.enabled)


@then(parsers.parse('input "{description}" as description, and click save'))
def input_test_wheel_smb_share_as_description_and_click_save(driver, description):
    """input "test wheel SMB share" as description, and click save."""
    assert wait_on_element(driver, 5, xpaths.smb.description_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.description_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_Input).send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('if Restart SMB Service box appears, click Restart Service')
def if_restart_smb_service_box_appears_click_restart_service(driver):
    """if Restart SMB Service box appears, click Restart Service."""
    rsc.Start_Or_Restart_SMB_Service(driver)

    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('the {share_name} should be added to the Shares list'))
def the_ldapsmbshare_should_be_added_to_the_shares_list(driver, share_name):
    """the ldapsmbshare should be added to the Shares list."""
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Share_Name(share_name))
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Service_Status)


@then(parsers.parse('send a file to the "{share_name}" and "{user}"%"{password}" should succeed'))
def send_a_file_to_the_wheelsmbshare(driver, nas_ip, share_name, user, password):
    """send a file to the "wheelsmbshare" and "{user}"%"{password}"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{share_name} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


@then('verify that the file is in the dataset')
def verify_that_the_file_is_in_the_dataset(root_password, nas_ip):
    """verify that the file is in the dataset."""
    file = f'{dataset_path}/testfile.txt'
    results = post(nas_ip, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 200, results.text


@then(parsers.parse('send a file to "{share_name}" with "{user}"%"{password}" should fail'))
def send_a_file_to_wheelsmbshare_with_foo_should_fail(driver, nas_ip, share_name, user, password):
    """send a file to "wheelsmbshare" with "{user}"%"{password}" should fail."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{share_name} -U {user}%{password} -c "put testfile2.txt testfile2.txt"')
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


@then('verify that the file is not is in the dataset')
def verify_that_the_file_is_not_is_in_the_dataset(root_password, nas_ip):
    """verify that the file is not is in the dataset."""
    file = f'{dataset_path}/testfile2.txt'
    results = post(nas_ip, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 422, results.text
    assert results.json()['message'] == f'Path {dataset_path}/testfile2.txt not found', results.text
