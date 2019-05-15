# !/usr/bin/env python
# Author: Eric Turgeon
# License: BSD

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


def test_00_open_web_browser(wb_driver, ui_url):
    wb_driver.get(ui_url)
    time.sleep(1)
    # setup implicit wait
    wb_driver.implicitly_wait(1)
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_01_login(wb_driver, login_json):
    for dictionary in login_json["tests"][0]["commands"]:
        command = dictionary['command']
        comment = dictionary['comment']
        target = dictionary["target"].replace("xpath=", "")
        value = dictionary['value']

        if command == 'open' or command == 'setWindowSize':
            pass
        elif command == 'click' and comment == "":
            wb_driver.find_element_by_xpath(target).click()
        elif command == 'type':
            wb_driver.find_element_by_xpath(target).clear()
            wb_driver.find_element_by_xpath(target).send_keys(value)
        elif command == 'click' and comment == "verify":
            time.sleep(2)
            ui_element = wb_driver.find_element_by_xpath(target)
            page_data = ui_element.text
            assert "Dashboard" in page_data, page_data
        time.sleep(0.10)
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
