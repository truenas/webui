FROM debian:bookworm-slim

# Install packages including Node.js prerequisites
#COPY docker/krb5.conf /etc/krb5.conf
RUN apt-get update && \
	export DEBIAN_FRONTEND=noninteractive && apt-get -yq install  \
	curl \
	ca-certificates \
	gnupg \
	nginx \
	&& apt-get clean

# Install Node.js from NodeSource (exact version 20.19)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs=20.19.0-1nodesource1

# Install Yarn
RUN npm install -g yarn

# Build UI
COPY ./ /src-ui
WORKDIR /src-ui
RUN yarn install --frozen-lockfile
RUN yarn build:prod:aot

# Copy built files to web directory
RUN cp -r /src-ui/dist /var/www/webui

# Cleanup build artifacts
RUN rm -rf /src-ui \
	&& rm -rf /root/.cache \
	&& rm -rf /usr/local/share/.cache \
	&& rm -rf /usr/local/share/.config \
	&& rm -rf /root/.npm

# Overlay install
COPY docker/start.sh /start.sh
COPY docker/nginx.conf /etc/nginx/tn-nginx.conf

WORKDIR /

# Configure Services and Port
CMD ["/start.sh"]

EXPOSE 80 443
