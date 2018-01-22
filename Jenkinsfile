pipeline {
    agent { label 'FreeNAS' }
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    options { disableConcurrentBuilds() }
    throttle(['webui']) {
      node('FreeNAS') {
	stage('Pre-Cleanup') {
	    steps {
                echo 'Cleaning environment'
		sh 'cd $WORKSPACE ; rm -rf node_modules ; rm -f package-lock.json'
		sh 'npm cache clear --force'
            }
        }
      	stage('NPM Install') {
	    steps {
                echo 'NPM Install...'
		sh 'npm cache clear --force'
		sh 'npm install'
            }
        }
	stage('NPM Build') {
	    steps {
                echo 'NPM build...'
		sh 'npm run build:prod:aot'
            }
        }

      }
    }
}
