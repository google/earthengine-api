#!/usr/bin/env python
# Lint as: python3
#
# Copyright 2012 Google Inc. All Rights Reserved.

"""Setup file for Earth Engine Python API package."""

import re

try:
  # if setuptools is available, use it to take advantage of its dependency
  # handling
  from setuptools import setup                          # pylint: disable=g-import-not-at-top
except ImportError:
  # if setuptools is not available, use distutils (standard library). Users
  # will receive errors for missing packages
  from distutils.core import setup                      # pylint: disable=g-import-not-at-top


def GetVersion():
  with open('ee/__init__.py') as f:
    return re.findall(r'__version__\s*=\s*\'([.\d]+)\'', f.read())[0]


setup(
    name='earthengine-api',
    version=GetVersion(),
    description='Earth Engine Python API',
    url='http://code.google.com/p/earthengine-api/',  # home page for package
    download_url='',  # package download URL
    packages=['ee', 'ee.cli'],
    package_data={
        'ee': ['tests/*.py',],
        'ee.cli': ['licenses.txt'],
    },
    test_suite='ee/tests',
    install_requires=[
        # Note we omit TensorFlow (used by the CLI) here on purpose to avoid
        # an extra 0.5GiB of deps compared to our current 26MiB; Use of TF
        # functionality requires a manual install of TensorFlow.
        'future',
        'google-cloud-storage',
        'google-api-python-client>=1.12.1',
        'google-auth>=1.4.1',
        'google-auth-httplib2>=0.0.3',
        'httplib2>=0.9.2,<1dev',
        'httplib2shim',
        'six'
    ],
    entry_points={
        'console_scripts': ['earthengine = ee.cli.eecli:main',],
    },
    classifiers=[
        # Get strings from
        # http://pypi.python.org/pypi?%3Aaction=list_classifiers
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Science/Research',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Topic :: Multimedia :: Graphics :: Viewers',
        'Topic :: Scientific/Engineering :: GIS',
        'Topic :: Scientific/Engineering :: Visualization',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ],
    keywords='earth engine image analysis',
    author='Noel Gorelick',
    author_email='gorelick@google.com',
    long_description="""\
=======================
Earth Engine Python API
=======================
This package allows developers to interact with Google Earth Engine using the
Python programming language.
""",
)
