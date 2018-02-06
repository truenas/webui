# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

from source import *
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = {'usernameTxtBox': "/html/body/app-root/app-auth-layout/app-signin/div/div/mat-card/mat-card-content/div[1]/form/div[1]/mat-input-container/div/div[1]/div/input",
          'passwordTxtBox': "/html/body/app-root/app-auth-layout/app-signin/div/div/mat-card/mat-card-content/div[1]/form/div[2]/mat-input-container/div/div[1]/div/input",
          'submitButton': "/html/body/app-root/app-auth-layout/app-signin/div/div/mat-card/mat-card-content/div[1]/form/button",
          }


class login_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.get(ui_url)

    def test_01_login(self):
        print ("loging in FreeNAS new webui- woot woot")
        # enter username in the username textbox
        driver.find_element_by_xpath(xpaths['usernameTxtBox']).clear()
        driver.find_element_by_xpath(xpaths['usernameTxtBox']).send_keys(username)
        # enter password in the password textbox
        driver.find_element_by_xpath(xpaths['passwordTxtBox']).send_keys(password)
        # click
        driver.find_element_by_xpath(xpaths['submitButton']).click()
        # check if the dashboard opens
        time.sleep(1)
        # get the ui element
        ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li/a")
        # get the weather data
        page_data=ui_element.text
        print ("The page now is: " + page_data)
        # assert response
        self.assertTrue("Dashboard" in page_data)
        # cancelling the tour
        if self.is_element_present(By.XPATH, "/html/body/div[5]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[5]/div[1]/button").click()
        driver.execute_script("document.body.style.zoom='50 %'")

    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    @classmethod
    def tearDownClass(inst):
        pass

def run_login_test(webdriver, ip):
    global driver
    driver = webdriver
    global ui_url
    ui_url = "http://%s/ui" % ip
    suite = unittest.TestLoader().loadTestsFromTestCase(login_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
