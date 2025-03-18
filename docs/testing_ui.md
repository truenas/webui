# Testing Specific UI Version

Latest version of TrueNAS WebUI and every PR is also available for testing in form of a docker image.

You still need to have a running TrueNAS instance to point UI to.

For example:

```sh
$ docker container run -it -e TNIP=<TrueNAS IP or hostname> -p 8080:80 ixsystems/truenas-webui:latest
```

This would allow you to access the running WebUI on http://localhost:8080

To test a pull request this way, replacee `:latest` with the pull-request ID.

```sh
$ docker container run -it -e TNIP=<TrueNAS IP or hostname> -p 8080:80 ixsystems/truenas-webui:5167
```
