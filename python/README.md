# Introduction #

The page gives an overview of installing the Google Earth Engine Python API.

# Ubuntu Linux Installation #

## Python 2.6+ ##

Linux users will already have Python installed. You can check the version of
Python that is installed by running the following command:

`python --version`

If you are using Python 2.5 or Python 3, you will need to also install
Python 2.6 or 2.7.

## PIP ##

[PIP](http://pip.readthedocs.org/en/latest/) is a package manager for Python.
The following installation instructions assume that you are using the Python
package manager. Pip can be installed with the following command:

`sudo apt-get install python-pip`

## Google APIs Client Library for Python ##

The Google APIs Client Library for Python provides support for authenticating
to the Earth Engine servers. The library can be installed from the Python
Package index by running the following command:

`sudo pip install google-api-python-client`

Alternatively, the library can be built from the source code,
[available on GitHub](https://github.com/google/google-api-python-client).

## OpenSSL ##

OpenSSL is a toolkit that implements Secure Sockets Layer protocol. To check
if the OpenSSL library is installed on your system, run the following command,
which will print the version of the library:

`openssl version`

On Ubuntu/Debian systems, the library can be installed by running the following
command:

`sudo apt-get install openssl`

## pyOpenSSL ##

pyOpenSSL is a Python wrapper for the OpenSSL library. The pyOpenSSL library
can be installed from the Python Package Index by running the following command:

`sudo pip install 'pyOpenSSL>=0.11'`

Alternatively, the library can be built from the source code,
[available on GitHub](https://github.com/pyca/pyopenssl).

## pyCrypto ##

The pyCrypto library can be installed from the Python Package Index by running
the following command:

`sudo pip install pyCrypto`

To verify that the pyCrypto library has been installed correctly, run the
following command:

`python -c "from oauth2client import crypt"`

If no error is returned, the library has been correctly installed.

## Earth Engine Python API ##

The Earth Engine Python library can be installed from the Python Package Index
by running the following command:

`sudo pip install earthengine-api`

### Installing manually from Source Code ###

To install the Earth Engine API manually, download the package from the
[PyPI download page](http://pypi.python.org/packages/source/e/earthengine-api/)
and expand the archive file:

`tar -zxvf earthengine-api-VERSION.tar.gz`

Next switch into the expanded directory and run the setup script:

```
cd earthengine-api-VERSION
python setup.py install
```

# Mac OS X Installation #

The installation instructions assume that you are using Mac OS X 10.9+, the
[Homebrew](http://brew.sh/) Mac OS package manager, and the
[PIP](http://pip.readthedocs.org/en/latest/) Python package manager.
Feel free to use a different package manager such as [Fink](www.finkproject.org)
or [MacPorts](https://www.macports.org/) if you prefer.

Homebrew can be installed with:

`ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

Then Pip (and Python) can be installed with the following command:

`brew install python`

Note: Mac OS X ships with a default version of Python 2. Homebrew will install
its own Python 2.7, which we'll be using to avoid interfering with
the system-level configuration.

## Python 2.6+ ##

You can check the version of Python that is installed by running the
following command:

`python --version`

If you are using Python 2.5 or Python 3, you will need to also install
Python 2.6 or 2.7.

## Google APIs Client Library for Python ##

The [Google APIs Client Library](https://github.com/google/google-api-python-client)
for Python provides support for authenticating to the Earth Engine servers.
The library can be installed from the Python Package index by running the
following command:

`pip install google-api-python-client`

## OpenSSL ##

OpenSSL is a toolkit that implements Secure Sockets Layer protocol. To check if
the OpenSSL library is installed on your system, run the following command,
which will print the version of the library:

`openssl version`

The library can be installed by running the following command:

`brew install openssl`


## pyOpenSSL ##

[pyOpenSSL](https://github.com/pyca/pyopenssl) is a Python wrapper for the
OpenSSL library. The pyOpenSSL library can be installed from the Python Package
Index by running the following command:

`pip install 'pyOpenSSL>=0.11'`


## pyCrypto ##

The pyCrypto library can be installed from the Python Package Index by running
the following command:

`pip install pyCrypto`

To verify that the pyCrypto library has been installed correctly, run the
following command:

`python -c "from oauth2client import crypt"`

If no error is returned, the library has been correctly installed.

## Earth Engine Python API ##

The Earth Engine Python library can be installed from the Python Package Index
by running the following command:

`pip install earthengine-api`

# Windows Installation #

[Installing PIP and virtualenv in Windows.](http://www.tylerbutler.com/2012/05/how-to-install-python-pip-and-virtualenv-on-windows-with-powershell/)

[Installing earthengine-api on Windows7 with 64bit Python2.7](https://groups.google.com/forum/?fromgroups#!searchin/google-earth-engine-developers/windows$20install/google-earth-engine-developers/iq8EPUVI1e8/i3Zf01nMVywJ)

# Uninstalling the Library #

## Uninstalling using the PIP package manager ##

To uninstall, simply run the following command.

`pip uninstall google-api-python-client`

## Uninstalling manually ##

The setup script installs numerous Python files. To uninstall, simply find the
files and remove them from your system.

On a Linux system, the package may be found here:

```
/usr/local/lib/python2.7/dist-packages/earthengine_api-0.#.###.egg-info
/usr/local/lib/python2.7/dist-packages/ee/
```

## Uninstalling manually ##

The setup script installs numerous Python files.  To uninstall, simply find the
files and remove them from your system. On a Windows system with the default
Python installation path, the package may be found here:

`C:\Python27\Lib\site-packages\earthengine_api-0.#.###-py2.7.egg`

Note that the file locations may vary depending on you system configuration.

# Testing Out the Full Installation #

In order to test out installation, users first need to authenticate.
Please see the [Earth Engine API Docs](https://sites.google.com/site/earthengineapidocs/python-api)
for details.
