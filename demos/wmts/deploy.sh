mkdir lib

pip install --upgrade -t lib -r requirements.txt --system

gcloud app deploy --project "$1"
