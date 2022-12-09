# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import xpaths
import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    run_cmd,
    post
)
from pytest_dependency import depends
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T965.feature', 'Create a smb share with the LDAP dataset')
def test_create_a_smb_share_the_ldap_dataset(driver):
    """Create a smb share with the LDAP dataset."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "nas_url"."""
    depends(request, ['NAS-T940'], scope='session')
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "user" and "password"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 7, xpaths.dashboard.system_information)


@then('Go on Sharing click Windows Shares(SMB)')
def go_on_sharing_click_windows_shares_smb(driver):
    """Go on Sharing click Windows Shares(SMB)."""
    assert wait_on_element(driver, 7, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('The Windows Shares(SMB) page should open')
def the_windows_sharessmb_page_should_open(driver):
    """The Windows Shares(SMB) page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')


@then('Click Add')
def click_add(driver):
    """Click Add."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Samba_ADD"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic")]')


@then(parsers.parse('Set Path to the LDAP dataset "{path}"'))
def set_path_to_the_ldap_dataset_mntdozermyacldataset(driver, path):
    global smb_path
    smb_path = path
    """Set Path to the LDAP dataset "/mnt/dozer/my_ldap_dataset"."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)


@then(parsers.parse('Input "{smbname}" as name, Click to enable'))
def input_ldapmbshare_as_name_click_to_enable(driver, smbname):
    """Input "ldapsmbshare" as name, Click to enable."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')


@then(parsers.parse('Input "{description}" as description'))
def input_my_smb_test_share_as_description(driver, description):
    """Input "My smb test share" as description."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('Click Summit')
def click_summit(driver):
    """Click Summit."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Configure ACL")]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()


@then(parsers.parse('The "{smbname}" should be added'))
def the_ldapsmbshare_should_be_added(driver, smbname):
    """The "ldapsmbshare" should be added."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, f'//div[contains(.,"{smbname}")]')


@then('Click on service')
def click_on_service(driver):
    """Click on service."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('The Service page should open')
def the_service_page_should_open(driver):
    """The Service page should open."""
    assert wait_on_element(driver, 7, '//services')


@then('If the SMB service is not started start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """If the SMB service is not started start the service."""
    assert wait_on_element(driver, 7, '//services')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__SMB_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(2)


@then('Click on SMB Start Automatically checkbox')
def click_on_smb_start_automatically_checkbox(driver):
    """Click on SMB Start Automatically checkbox."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__SMB_Start Automatically"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__SMB_Start Automatically"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__SMB_Start Automatically"]').click()


@then(parsers.parse('Send a file to the share with "{nas_url}"/"{smbname}" and "{user}"%"{password}"'))
def send_a_file_to_the_share_with_nas_url_smbname_and_user_password(driver, nas_url, smbname, user, password):
    """Send a file the share with "nas_url"/"smbname" and "user"%"password"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_url}/{smbname} -W AD01 -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then(parsers.parse('Verify that the file is on "{nas_url}" with "{user}" and "{password}"'))
def Verify_that_the_file_is_on_url_with_root_and_password(driver, nas_url, user, password):
    """Verify that the file is on "{nas_url}" with "{user}" and "{password}"."""
    results = post(nas_url, 'filesystem/stat/', (user, password), f'{smb_path}/testfile.txt')
    assert results.status_code == 200, results.text


@then('Go to Directory Services and select LDAP')
def go_to_directory_services_and_select_ldap(driver):
    """Go to Directory Services and select LDAP."""
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services_ldap)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services_ldap).click()


@then('Click the Enable checkbox and click SAVE')
def click_the_enable_checkbox_and_click_save(driver):
    """Click the Enable checkbox and click SAVE."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Server Credentials")]')
    driver.find_element_by_xpath(xpaths.checkbox.enable).click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 5, '//div[contains(.,"Settings saved.")]')
