New-Item -ItemType directory -Force -Path temp

cd temp

Function BuildDep([string]$name, [string]$url, [string]$tag, [string]$dir)
{
    git clone $url $name
    cd $name
    git checkout -b $tag
    mv $dir ../../
    cd ..
    Remove-Item -Recurse -Force $name
}

# Build oauth2client.
BuildDep oauth2client https://github.com/google/oauth2client.git tags/v4.1.2 oauth2client
BuildDep pyasn1 https://github.com/etingof/pyasn1 tags/v0.4.2 pyasn1
BuildDep pyasn1_modules https://github.com/etingof/pyasn1-modules tags/v0.2.1 pyasn1_modules
BuildDep rsa https://github.com/sybrenstuvel/python-rsa tags/version-3.4.2 rsa

BuildDep six https://github.com/benjaminp/six tag/1.11.0 six.py

# Build the Earth Engine Python client library.
BuildDep ee https://github.com/google/earthengine-api.git v0.1.60 python/ee

# Build httplib2.
BuildDep httplib2 https://github.com/jcgregorio/httplib2.git tags/v0.9.1 python2/httplib2

cd ..
Remove-Item temp