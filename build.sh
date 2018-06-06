#!/bin/bash
set -e
set -o pipefail

instructions()
{
  echo "usage: ./build.sh deploy <env>"
  echo ""
  echo "env: eg. test, dev, stage, prod, ..."
  echo ""
  echo "for example: ./build.sh test"
}

if [ $# -eq 0 ]; then
  instructions
  exit 1
elif [ "$1" = "test" ] && [ $# -eq 1 ]; then
  npm install
  npm lint
  npm run test
elif [ "$1" = "deploy" ] && [ $# -eq 2 ]; then
  STAGE=$2
  npm install
  npm lint
  npm test
  'node_modules/.bin/sls' deploy -s $STAGE
else 
  instructions
  exit 1
fi