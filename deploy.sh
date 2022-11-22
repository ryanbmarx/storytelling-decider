#!/usr/bin/env sh

set -e

# staging or production?
BUCKET="dev"
while [ "$1" != "" ]; do
	case $1 in
		--staging )
			shift
			BUCKET="dev"
			;;

		--preprod )
			shift
			BUCKET="preprod"
			;;

		--production )
			shift
			BUCKET="master"
			;;

		* ) shift;;
	esac
done

echo "Deploying to $BUCKET ..."

CDN_AUTH=$(echo $CDN_AUTH | base64 --decode)
USAT_AUTH=$(echo $USAT_AUTH | base64 --decode)
USCP_AUTH=$(echo $USCP_AUTH | base64 --decode)

CDN_SPACE="gs://usat-storytelling/storytelling-studio-apps/$BUCKET"
PUBLIC_PATH="https://www.gannett-cdn.com/usat-storytelling/storytelling-studio-apps/$BUCKET"
CDN_PATH="https://$CDN_AUTH@www.gannett-cdn.com/usat-storytelling/storytelling-studio-apps/$BUCKET"
DEV_DOMAIN="dev-uw.usatoday.com"

PROJECT_SLUG="$(basename $(pwd))"
PROJECT_FOLDER="./public"

PUBLIC_URL="$PUBLIC_PATH/$PROJECT_SLUG/index.html"

gsutil -m rsync -r $PROJECT_FOLDER "$CDN_SPACE/$PROJECT_SLUG"

# sometimes we need a special index file on the cdn
if [[ -f "$PROJECT_FOLDER/index.cdn.html" ]]; then
	gsutil cp "$PROJECT_FOLDER/index.cdn.html" "$CDN_SPACE/$PROJECT_SLUG/index.html"
fi

for filename in $(cd $PROJECT_FOLDER && find *); do
	#echo "$CDN_PATH/$PROJECT_SLUG/$filename"
	curl -X PURGE "$CDN_PATH/$PROJECT_SLUG/$filename" &
done

curl -X PURGE "$CDN_PATH/$PROJECT_SLUG/index.html" -m 10 &

echo "PURGING AZCENTRAL"
curl -X PURGE "https://$(echo $USCP_AUTH | base64 --decode)@www.azcentral.com/storytelling/kari-lake-katie-hobbs-arizona-governor-candidate-how-choose/" -m 10 &
curl -X PURGE "https://$(echo $USCP_AUTH | base64 --decode)@www.azcentral.com/storytelling/mark-kelly-blake-masters-arizona-senate-candidate-how-choose/" -m 10 &

# Add AllUsers:R to the project folder
gsutil -m acl ch -u AllUsers:R  -r "$CDN_SPACE/$PROJECT_SLUG"

# don't cache html files, like embeds and preview links
gsutil -m setmeta -h "Cache-Control:private, max-age=0, no-transform" "$CDN_SPACE/$PROJECT_SLUG/*.html"


wait
echo "Deployed:"
echo $PUBLIC_URL
