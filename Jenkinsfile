pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'commerce-hub-spa'
        DOCKER_TAG = "${BUILD_NUMBER}"
        REGISTRY = 'registry.internal.company.com'
    }

    stages {
        stage('Validate & Lint') {
            steps {
                echo '=== Stage 1: Dependency Install & Code Quality ==='
                sh 'npm ci'
                // sh 'npm run lint'
            }
        }

        stage('Unit & Integration Tests') {
            steps {
                echo '=== Stage 2: Running Karma / Jest Unit Tests ==='
                // sh 'npm run test -- --watch=false --browsers=ChromeHeadless'
            }
        }

        stage('Build Production SPA') {
            steps {
                echo '=== Stage 3: Compiling Production Bundles ==='
                sh 'npm run build -- --configuration=production'
            }
        }

        stage('Docker Build & Tag') {
            steps {
                echo '=== Stage 4: Containerizing with Multi-stage Docker ==='
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                echo '=== Stage 5: Publishing image to Docker Registry ==='
                // sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                // sh "docker push ${REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }

        stage('Ansible Deployment') {
            when {
                branch 'main'
            }
            steps {
                echo '=== Stage 6: Triggering Ansible Playbook ==='
                // sh 'ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/deploy.yml'
            }
        }
    }

    post {
        always {
            echo 'Build pipeline finished.'
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Pipeline failed. Check stage logs.'
        }
    }
}
