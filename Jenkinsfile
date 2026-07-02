// =====================================================================
//  Pipeline CI/CD - TaskList FRONTEND (React + Vite + TypeScript)
//  Cible : infrastructure Jenkins de l'école (agents avec Node, Docker
//  et Trivy préinstallés ; serveur SonarQube "sonarqube-server-1").
// ---------------------------------------------------------------------
//  Credential Jenkins requis (jamais en clair dans le code) :
//    - dockerhub-credentials : "Username with password" (login Docker Hub)
//  Le token SonarQube est injecté automatiquement par withSonarQubeEnv.
// =====================================================================

pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        IMAGE_NAME = 'tommyk78/tasklist-frontend-exam'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm ci --include=dev'
            }
        }

        stage('Unit Tests') {
            steps {
                echo 'Running unit tests with coverage...'
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit 'reports/junit.xml'
                }
            }
        }

        stage('Build') {
            steps {
                echo 'Building React/Vite project...'
                sh 'npm run build'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                withSonarQubeEnv('sonarqube-server-1') {
                    sh 'npx sonarqube-scanner'
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                echo 'Checking SonarQube Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t $IMAGE_NAME:$BUILD_NUMBER -t $IMAGE_NAME:latest -f Dockerfile .'
            }
        }

        stage('Scan with Trivy') {
            steps {
                echo 'Scanning Docker image with Trivy...'
                sh 'trivy image --format json --output trivy-report.json --severity HIGH,CRITICAL $IMAGE_NAME:$BUILD_NUMBER'
                sh 'trivy image --format spdx-json --output sbom-spdx.json $IMAGE_NAME:$BUILD_NUMBER'
                sh 'trivy image --format table --severity HIGH,CRITICAL $IMAGE_NAME:$BUILD_NUMBER'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json, sbom-spdx.json', fingerprint: true, allowEmptyArchive: true
                }
            }
        }

        stage('Publish to Docker Hub') {
            steps {
                echo 'Publishing image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials',
                                                   usernameVariable: 'DOCKER_USER',
                                                   passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push $IMAGE_NAME:$BUILD_NUMBER
                        docker push $IMAGE_NAME:latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
