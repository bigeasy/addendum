application_directory=$(dirname $(dirname $(readlink -f $0)))
PATH="$PATH":"$application_directory/node_modules/.bin"
