build:
	- docker build -t deeplink .

push:
	- docker tag deeplink:latest jlestel/public:deeplink-latest
	- docker push jlestel/public:deeplink-latest