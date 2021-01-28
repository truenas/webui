#!/bin/sh

if [ -z "$TNIP" ] ; then
	echo "Error, need to supply -e TNIP=<IP of TrueNAS>"
	exit 1
fi

# Set proper hostname for passthrough to TrueNAS Middleware
sed -i'' "s|%%HOSTNAME%%|${TNIP}|g" /etc/nginx/tn-nginx.conf

# Set timestamp for the version string to force a webui cache invalidation
TSTAMP=$(date +%s)
sed -i'' "s|%%VERTAG%%|${TSTAMP}|g" /etc/nginx/tn-nginx.conf

echo "To connect to WebUI: http://localhost:<port>"
nginx -c /etc/nginx/tn-nginx.conf 
