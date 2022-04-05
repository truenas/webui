# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T977.feature', 'Setting up an ISCSI share')
def test_setting_up_an_iscsi_share(driver):
    """Setting up an ISCSI share."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_user}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('if login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 7, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 20, '//span[contains(.,"System Information")]')


@then('go to sharing click iscsi')
def go_to_sharing_click_iscsi(driver):
    """go to sharing click iscsi."""
    assert wait_on_element(driver, 7, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]').click()


@then('the iscsi page should open')
def the_iscsi_page_should_open(driver):
    """the iscsi page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"iSCSI")]')


@then('click Authorized Access tab, then click Add')
def click_authorized_access_tab_then_click_add(driver):
    """click Authorized Access tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Authorized Access"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Authorized Access")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Group")]')


@then(parsers.parse('input Group ID "{gid}", User "{user}", secret * "{password}",'))
def input_group_id_1_user_user_secret__password(driver, gid, user, password):
    """input Group ID "1", User "user", secret * "password",."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Group ID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Group ID"]').send_keys(gid)
    driver.find_element_by_xpath('//input[@ix-auto="input__User"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__User"]').send_keys(user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret"]').send_keys(password)


@then(parsers.parse('input secret (Confirm) "{passwordc}", Peer user "{peer_user}",'))
def input_secret_confirm_password_peer_user_peertest(driver, passwordc, peer_user):
    """input secret (Confirm) "passwordc", Peer user "peertest",."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret (Confirm)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret (Confirm)"]').send_keys(passwordc)
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer User"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer User"]').send_keys(peer_user)


@then(parsers.parse('input Peer secret "{password}", Peer secret (Confirm) "{passwordc}"'))
def input_peer_secret_password_peer_secret_confirm_passwordc(driver, password, passwordc):
    """input Peer secret "password", Peer secret (Confirm) "passwordc"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret"]').send_keys(password)
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret (Confirm)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret (Confirm)"]').send_keys(passwordc)


@then('click Summit')
def click_summit(driver):
    """click Summit."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('you should be retune to the Authorized Access tab')
def then_you_should_be_retune_to_the_authorized_access_tab(driver):
    """you should be retune to the Authorized Access tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Authorized Access")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"usertest")]')


@then('click Portals tab, then click Add')
def click_portals_tab_then_click_add(driver):
    """click Portals tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Portals"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Description "{description}", select Discovery Auth Method "{method}"'))
def input_description_my_iscsi_select_discovery_auth_method_chap(driver, description, method):
    """input Description "my iscsi", select Discovery Auth Method "Chap"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]').click()


@then(parsers.parse('select Discovery Auth Group "{gid}", IP address "{ip}", Port "{ports}"'))
def select_discovery_auth_group_1_ip_address_0000_port_3260(driver, gid, ip, ports):
    """select Discovery Auth Group "1", IP address "0.0.0.0", Port "3260"."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Group"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Discovery Authentication Group_{gid}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Discovery Authentication Group_{gid}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__IP Address"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__IP Address_{ip}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__IP Address_{ip}"]').click()
    actions = ActionChains(driver)
    actions.send_keys(Keys.ESCAPE)
    actions.perform()
    driver.find_element_by_xpath('//input[@ix-auto="input__Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Port"]').send_keys(ports)


@then('you should be retune to the Portals tab')
def then_you_should_be_retune_to_the_portals_tab(driver):
    """you should be retune to the Portals tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"my iscsi")]')


@then('click Initiators Group tab, then click Add')
def click_initiators_group_tab_then_click_add(driver):
    """click Initiators Group tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Initiators Groups"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Initiators Groups")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//span[contains(.,"Allow All Initiators")]')


@then(parsers.parse('input "{description}" in Description input "{initiator}" in Allowed Initiators then click +'))
def input_Group_ID_1_in_description_input_initiator_in_allowed_initiators_then_click_plus(driver, description, initiator):
    """input "description" in Description input "initiator" in Allowed Initiators then click +."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    driver.find_element_by_xpath('//input[@ix-auto="input__Allowed Initiators (IQN)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Allowed Initiators (IQN)"]').send_keys(initiator)
    driver.find_element_by_xpath('(//button[contains(.,"add")])[1]').click()


@then(parsers.parse('input "{ip}" in Authorized networks then click +'))
def input_ip_in_authorized_networks_then_click_plus(driver, ip):
    """input "ip" in Authorized networks then click +."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Networks"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Networks"]').send_keys(ip)
    driver.find_element_by_xpath('(//button[contains(.,"add")])[2]').click()


@then('click Save')
def click_save(driver):
    """click Save."""
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()


@then('you should be retune to the Initiators Group tab')
def then_you_should_be_retune_to_the_initiators_group_tab(driver):
    """you should be retune to the Initiators Group tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Initiators Groups")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"Group ID 1")]')


@then('click Targets tab, then click Add')
def click_targets_tab_then_click_add(driver):
    """click Targets tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Target name "{target_name}", Target alias "{target_alias}", Portal Group ID select "{group}"'))
def input_target_name_ds1_target_alias_ds1_portal_group_id_select_1(driver, target_name, target_alias, group):
    """input Target name "ds1", Target alias "ds1", Portal Group ID select "1"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').send_keys(target_name)
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').send_keys(target_alias)
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Portal Group ID"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Portal Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Portal Group ID_{group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Portal Group ID_{group}"]').click()


@then(parsers.parse('Initiator Group ID select "{initiator_group}", Auth Method Select "{method}", Authentication Group Number Select "{gid}"'))
def initiator_group_id_select_1_auth_method_select_mutual_chap_authentication_group_number_select_1(driver, initiator_group, method, gid):
    """Initiator Group ID select "1", Auth Method Select "Mutual Chap", Authentication Group Number Select "1"."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Initiator Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Authentication Method_{method}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Authentication Group Number"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Authentication Group Number_{gid}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Authentication Group Number_{gid}"]').click()


@then('you should be retune to the Targets tab')
def then_you_should_be_retune_to_the_targets_tab(driver):
    """you should be retune to the Targets tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"ds1")]')


@then('click Extents tab, then click Add')
def click_extents_tab_then_click_add(driver):
    """click Extents tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Extents"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Extent name "{name}", select "{extent_type}" for Extent Type, select "{device}" for Device'))
def input_extent_name_ds1__extent_type_device_device__tankds1(driver, name, extent_type, device):
    """input Extent name "ds1", select "Device" for Extent Type select "tank/ds1 (1.00G)" for Device."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(name)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent Type"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Device"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Device_{device}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Device_{device}"]').click()


@then('you should be retune to the Extents tab')
def then_you_should_be_retune_to_the_extents_tab(driver):
    """you should be retune to the Extents tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"ds1")]')


@then('click Associated Targets tab, then click Add')
def click_associated_targets_tab_then_click_add(driver):
    """click Associated Targets tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Associated Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Associated Target")]')


@then(parsers.parse('select "{target}" for Target, input "{lun_id}" for LUN ID, select "{extent}" for Extent'))
def select_ds1_Target_input_1_for_lun_id_select_ds1_extent(driver, target, lun_id, extent):
    """select "ds1" for Target, input "1" for LUN ID, select "ds1" for Extent."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Target"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Target_{target}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Target_{target}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').send_keys(lun_id)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent_{extent}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent_{extent}"]').click()


@then('you should be retune to the Associated Targets tab')
def then_you_should_be_retune_to_the_associated_targets_tab(driver):
    """you should be retune to the Associated Targets tab."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"ds1")]')
