# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import time
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
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('if login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 0.5, 5, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 7, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 0.5, 7, '//a[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 0.5, 7, '//span[contains(.,"System Information")]')


@then('go to sharing click iscsi')
def go_to_sharing_click_iscsi(driver):
    """go to sharing click iscsi."""


@then('the iscsi page should open')
def the_iscsi_page_should_open(driver):
    """the iscsi page should open."""


@then('click Authorized Access tab, then click Add')
def click_authorized_access_tab_then_click_add(driver):
    """click Authorized Access tab, then click Add."""


@then(parsers.parse('input Group ID "{gid}", User "{user}", secret * "{password}",'))
def input_group_id_1_user_user_secret__password(driver):
    """input Group ID "1", User "user", secret * "password",."""


@then(parsers.parse('input secret (Confirm) "{password}", Peer user "{peer_user}",'))
def input_secret_confirm_password_peer_user_peertest(driver):
    """input secret (Confirm) "password", Peer user "peertest",."""


@then(parsers.parse('input Peer secret "{password}", Peer secret (Confirm) "{passwordc}"'))
def input_peer_secret_password_peer_secret_confirm_passwordc(driver):
    """input Peer secret "password", Peer secret (Confirm) "passwordc"."""


@then('click Summit')
def click_summit(driver):
    """click Summit."""


@then('then you should be retune to the Authorized Access tab')
def then_you_should_be_retune_to_the_authorized_access_tab(driver):
    """then you should be retune to the Authorized Access tab."""


@then('click Portals tab, then click Add')
def click_portals_tab_then_click_add(driver):
    """click Portals tab, then click Add."""


@then(parsers.parse('input Description "{description}", select Discovery Auth Method "{method}"'))
def input_description_my_iscsi_select_discovery_auth_method_chap(driver):
    """input Description "my iscsi", select Discovery Auth Method "Chap"."""


@then(parsers.parse('select Discovery Auth Group "{gid}", IP address "{ip}", Port "{ports}"'))
def select_discovery_auth_group_1_ip_address_0000_port_3260(driver):
    """select Discovery Auth Group "1", IP address "0.0.0.0", Port "3260"."""


@then('then you should be retune to the Portals tab')
def then_you_should_be_retune_to_the_portals_tab(driver):
    """then you should be retune to the Portals tab."""


@then('Change Discovery Auth Method to Mutual chap')
def change_discovery_auth_method_to_mutual_chap(driver):
    """Change Discovery Auth Method to Mutual chap."""


@then('click Initiators Group tab, then click Add')
def click_initiators_group_tab_then_click_add(driver):
    """click Initiators Group tab, then click Add."""


@then(parsers.parse('input Group ID "{gid}" Initiators click + "{initiator}"'))
def input_group_id_1_initiators_click_initiator(driver):
    """input Group ID "1" Initiators click + "initiator"."""


@then(parsers.parse('Authorized networks click + "{ip}"'))
def authorized_networks_click__10110024(driver):
    """Authorized networks click + "{ip}"."""


@then('click Save')
def click_save(driver):
    """click Save."""


@then('then you should be retune to the Initiators Group tab')
def then_you_should_be_retune_to_the_initiators_group_tab(driver):
    """then you should be retune to the Initiators Group tab."""


@then('click Targets tab, then click Add')
def click_targets_tab_then_click_add(driver):
    """click Targets tab, then click Add."""


@then(parsers.parse('input Target name "{target_name}", Target alias "{target_alias}", Portal Group ID select "{gid}"'))
def input_target_name_ds1_target_alias_ds1_portal_group_id_select_1(driver):
    """input Target name "ds1", Target alias "ds1", Portal Group ID select "1"."""


@then(parsers.parse('Initiator Group ID select "{gid}", Auth Method Select "{method}", Authentication Group Number Select "{g_number}"'))
def initiator_group_id_select_1_auth_method_select_mutual_chap_authentication_group_number_select_1(driver):
    """Initiator Group ID select "1", Auth Method Select "Mutual Chap", Authentication Group Number Select "1"."""


@then('then you should be retune to the Targets tab')
def then_you_should_be_retune_to_the_targets_tab(driver):
    """then you should be retune to the Targets tab."""


@then('click Extents tab, then click Add')
def click_extents_tab_then_click_add(driver):
    """click Extents tab, then click Add."""


@then(parsers.parse('input Extent name "{extent_name}",  Extent type device Device * "{device}"'))
def input_extent_name_ds1__extent_type_device_device__tankds1(driver):
    """input Extent name ds1,  Extent type device Device * tank/ds1."""


@then('then you should be retune to the Extents tab')
def then_you_should_be_retune_to_the_extents_tab(driver):
    """then you should be retune to the Extents tab."""


@then('click Associated Targets tab, then click Add')
def click_associated_targets_tab_then_click_add(driver):
    """click Associated Targets tab, then click Add."""


@then(parsers.parse('input Target * "{target}", LUN ID "{lun_id}", Extent "{extent}"'))
def input_target__ds1_lun_id_1_extent_ds1(driver):
    """input Target * "ds1", LUN ID "1", Extent "ds1"."""


@then('then you should be retune to the Associated Targets tab')
def then_you_should_be_retune_to_the_associated_targets_tab(driver):
    """then you should be retune to the Associated Targets tab."""
