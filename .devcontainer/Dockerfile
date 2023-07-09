FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

## [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends neovim

# USER node
# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=14
# RUN . /usr/local/share/nvm/nvm.sh; \
#   nvm install ${EXTRA_NODE_VERSION}; \
#   nvm alias default ${EXTRA_NODE_VERSION}; \
#   nvm use default

# [Optional] Uncomment if you want to install more global node modules
# RUN npm install -g yarn