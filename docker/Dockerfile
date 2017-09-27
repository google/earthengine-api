FROM gcr.io/cloud-datalab/datalab:latest
MAINTAINER Tyler Erickson <tylere@google.com>

# Install Earth Engine Python API dependencies.
RUN apt-get update \
  && apt-get install -y build-essential libssl-dev libffi-dev \
  && pip install cryptography \
  && apt-get purge -y build-essential libssl-dev libffi-dev \
                      dpkg-dev fakeroot libfakeroot:amd64 \
  && apt-get autoremove -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install IPyLeaflet. The notebook library dependency is downgraded to
# version 4.4.1 but the datalab repo warns about potential version issues:
# https://github.com/googledatalab/datalab/blob/master/containers/base/Dockerfile#L139
RUN pip install ipyleaflet \
  && jupyter nbextension enable --py --sys-prefix ipyleaflet \
  && pip install notebook==4.4.1

# Install the Earth Engine Python API.
RUN pip install earthengine-api

# Install custom files in the container's /datalab directory.
RUN cp /datalab/run.sh /datalab/base-run.sh
ADD run.sh /datalab/
RUN chmod a+x /datalab/run.sh

# Add license information for the new libraries added.
ADD datalab-ee.txt /datalab/
RUN cat /datalab/datalab-ee.txt >> /datalab/web/static/datalab.txt \
  && rm /datalab/datalab-ee.txt
ADD license-ee.txt /datalab/
RUN cat /datalab/license-ee.txt >> /datalab/license.txt \
  && rm /datalab/license-ee.txt
