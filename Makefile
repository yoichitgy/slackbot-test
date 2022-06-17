#
# Run upload command as the default.
#
all: upload

#
# Upload the code.
#
.PHONY: upload
upload:
ifndef function
	$(error Specify a function name. E.g. $$ make upload function=my-lambda-function)
endif
	zip -r lambda.zip .
	aws lambda update-function-code --function-name "$(function)" --zip-file fileb://lambda.zip
	rm lambda.zip
