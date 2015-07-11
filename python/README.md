The page explains how to install the Google Earth Engine Python API.


Ubuntu Linux & Mac OS X installation
====================================

After the initial set up, the installation flows for Mac OS X and Ubuntu
are nearly identical.

Set up pip and Python
---------------------

[PIP](http://pip.readthedocs.org/en/latest/) is a package manager for Python.
The following installation instructions assume that you are using it.

### Ubuntu Linux

Verify that you have Python 2.6 or 2.7:

    python --version

If needed, install 2.6 or 2.7 with `apt-get`. Then pip can be installed with:

    sudo apt-get install python-pip

### Mac OS X

The installation instructions assume that you are using Mac OS X 10.9+, the
[Homebrew](http://brew.sh/) Mac OS package manager, and the
[pip](http://pip.readthedocs.org/en/latest/) Python package manager.
Feel free to use a different package manager such as [Fink](www.finkproject.org)
or [MacPorts](https://www.macports.org/) if you prefer.

Homebrew can be installed with:

    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

Then pip (and Python) can be installed with the following command:

    brew install python

Note: Mac OS X ships with a default version of Python 2. Homebrew should install
its own Python 2.7, which we'll be using to avoid interfering with
the system-level configuration.

Regardless of you choice of package manager, verify that you have Python 2.6 or 2.7:

    python --version


Install Google APIs Client Library
----------------------------------

The Google APIs Client Library for Python provides support for authenticating
to the Earth Engine servers. The library can be installed from the Python
Package index by running the following command:

    sudo pip install google-api-python-client

Alternatively, the library can be built from the source code,
[available on GitHub](https://github.com/google/google-api-python-client).


Ensure that a crypto library is available
-----------------------------------------

If no error is returned by the following command, you can skip this step.

    python -c "from oauth2client import crypt"

If there's an error, you'll need to install a Cryto library on your system. You
can install _either_ PyCrypto (recommended) _or_ both OpenSSL and pyOpenSSL.

### pyCrypto

The pyCrypto library can be installed from the Python Package Index by running
the following command:

    sudo pip install pyCrypto

### OpenSSL

OpenSSL is a toolkit that implements Secure Sockets Layer protocol. To check
if the OpenSSL library is installed on your system, run the following command,
which will print the version of the library:

    openssl version

On Ubuntu/Debian, the library can be installed with:

    sudo apt-get install openssl

On Mac, the library can be installed with:

    brew install openssl

#### pyOpenSSL

pyOpenSSL is a Python wrapper for the OpenSSL library. The pyOpenSSL library
can be installed from the Python Package Index by running the following command:

    sudo pip install 'pyOpenSSL>=0.11'

Alternatively, the library can be built from the source code,
[available on GitHub](https://github.com/pyca/pyopenssl).


Install the Earth Engine Python API
-----------------------------------

The Earth Engine Python library can be installed from the Python Package Index
by running the following command:

    sudo pip install earthengine-api

### Installing manually from source code

To install the Earth Engine API manually, download the package from the
[PyPI download page](http://pypi.python.org/packages/source/e/earthengine-api/)
and expand the archive file:

    tar -zxvf earthengine-api-VERSION.tar.gz

Next switch into the expanded directory and run the setup script:

    cd earthengine-api-VERSION
    python setup.py install



Windows installation
====================

[Installing PIP and virtualenv in Windows.](http://www.tylerbutler.com/2012/05/how-to-install-python-pip-and-virtualenv-on-windows-with-powershell/)

[Installing earthengine-api on Windows7 with 64bit Python2.7](https://groups.google.com/forum/?fromgroups#!searchin/google-earth-engine-developers/windows$20install/google-earth-engine-developers/iq8EPUVI1e8/i3Zf01nMVywJ)



Set up authentication
=====================

To access Earth Engine, you'll also need to set up
[authentication credentials](https://developers.google.com/earth-engine/python_install#setting-up-authentication-credentials).



Uninstalling the library
========================

To uninstall using the PIP package manager, simply run the following command.

    pip uninstall google-api-python-client


Uninstalling manually
---------------------

The setup script installs numerous Python files.  To uninstall, simply find the
files and remove them from your system.

On a Windows system with the default Python installation path,
the package may be found here:

    C:\Python27\Lib\site-packages\earthengine_api-0.#.###-py2.7.egg

On a Linux system, the package may be found here:

    /usr/local/lib/python2.7/dist-packages/earthengine_api-0.#.###.egg-info
    /usr/local/lib/python2.7/dist-packages/ee/

Note that the file locations may vary depending on you system configuration.
