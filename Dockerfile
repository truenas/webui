##NODE temporary builder image
from node:20-bookworm as uibuilder
COPY ./ /src-ui
WORKDIR /src-ui
RUN yarn install --frozen-lockfile
RUN yarn build:prod:aot

FROM debian:stable-slim

# Install packages
RUN apt-get update && \
	DEBIAN_FRONTEND=noninteractive apt-get -yq install nginx && \
	apt-get clean

#Remove any extra packages we don't need from the container
# Also cleanup any random things we don't want to distribute
RUN export SUDO_FORCE_REMOVE=yes \
	&& apt autoremove -y || true \
	&& apt autoclean \
	&& rm -rf /root/.cache \
	&& rm -rf /usr/local/share/.cache \
	&& rm -rf /usr/local/share/.config

# Overlay install
COPY docker/start.sh /start.sh
COPY docker/nginx.conf /etc/nginx/tn-nginx.conf

# =========================
# COPY OVER THE BUILDS FROM OTHER CONTAINERS
# =========================
# WebUI Build
# Copy over site directory from the builder
COPY --from=uibuilder /src-ui/dist /var/www/webui

# Configure Services and Port
CMD ["/start.sh"]

EXPOSE 80 443
