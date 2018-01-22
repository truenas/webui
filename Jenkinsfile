throttle(['FreeNAS-webui']) {
  node('FreeNAS') {
      stage('Checkout') {
        checkout scm
      }
      stage('Cleanup') {
        echo 'Cleaning environment'
	sh 'cd $WORKSPACE ; rm -rf node_modules ; rm -f package-lock.json'
	sh 'npm cache clear --force'
      }
      stage('NPM Install') {
        echo 'NPM Install...'
	sh 'npm cache clear --force'
	sh 'npm install'
      }
      stage('NPM Build') {
        echo 'npm run build:prod:aot'
	sh 'npm run build:prod:aot'
      }
  }
}
