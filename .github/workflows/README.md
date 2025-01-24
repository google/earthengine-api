# Workflows

## Authenticating and Initializing Earth Engine in GitHub Actions

The
[publish-to-pypi](https://github.com/google/earthengine-api/blob/master/.github/workflows/publish-to-pypi.yml)
workflow uses the
[google-github-actions/auth](https://github.com/google-github-actions/auth)
GitHub action to authenticate with Google Cloud (see the snippet below).

### Authenticating via Workload Identity Federation

The Earth Engine smoke tests authenticate using workload identity federation.
See
[this guide](https://github.com/google-github-actions/auth?tab=readme-ov-file#workload-identity-federation-through-a-service-account) to
create a workload identity provider and populate the resulting `service_account`
and `workload_identity_provider` in your GitHub repository's Secrets and
Variables settings.

```yml
jobs:
  smoke-test:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v3
        with:
          python-version: 3.11
      - name: Authenticate with Google Cloud
        uses: 'google-github-actions/auth@v2'
        with:
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
```

The path to the credentials is stored in the
[`GOOGLE_APPLICATION_CREDENTIALS`](https://cloud.google.com/docs/authentication/application-default-credentials#GAC)
environment variable. To authenticate and initialize Earth Engine using the
credentials, see the snippet below.

```python
import json
import os

from google.auth import identity_pool

scopes = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/earthengine",
]
path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
info = json.load(open(path))
credentials = identity_pool.Credentials.from_info(info).with_scopes(scopes)
ee.Initialize(credentials, project=credentials.project_number)
```