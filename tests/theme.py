# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 7

from source import *
from selenium.webdriver.common.keys import Keys
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

xpaths = { 'themeBar' : "//*[@id='schemeToggle']/span/md-icon"
          }


class change_theme_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_theme1(self):
        self.theme_change("1")

    def test_02_theme2(self):
        self.theme_change("2")

    def test_03_theme3(self):
        self.theme_change("3")

    def test_04_theme4(self):
        self.theme_change("4")

    def test_05_theme5(self):
        self.theme_change("5")

    def test_06_theme6(self):
        self.theme_change("6")

    def test_07_theme7(self):
        self.theme_change("7")


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

    def theme_change(self, which):
        # Click on the theme Button
        driver.find_element_by_xpath(xpaths['themeBar']).click()
        # Select 1st theme
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/md-grid-list/div/md-grid-tile[" + str(which) + "]/figure/div/div[2]").click()
        time.sleep(3)


    @classmethod
    def tearDownClass(inst):
        pass

def run_change_theme_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(change_theme_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
