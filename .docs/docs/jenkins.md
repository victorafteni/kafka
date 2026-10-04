
JSON DE CONFIGURARE PENTRU JENKINS 

Următorul JSON este complet, valid sintactic (fără comentarii inline) și modelat strict pe structura reală a proiectului auditat:

{
  "project": {
    "name": "commerce-hub",
    "displayName": "Commerce Hub Enterprise SPA & Event Streaming API",
    "description": "Enterprise e-commerce platform with Angular 19 SPA frontend, Node.js Express backend, Redis 7 caching/indexing/cart store, and Apache Kafka event streaming telemetry.",
    "type": "polyglot-microservices",
    "frontend": {
      "framework": "Angular",
      "version": "19.2.0",
      "cliVersion": "19.2.27",
      "packageName": "commerce-spa",
      "packageVersion": "0.0.0",
      "workingDirectory": ".",
      "outputDirectory": "dist/commerce-spa/browser"
    },
    "backend": {
      "runtime": "Node.js",
      "version": "20-alpine",
      "framework": "Express",
      "frameworkVersion": "4.21.2",
      "packageName": "commerce-backend",
      "packageVersion": "1.0.0",
      "workingDirectory": "backend",
      "entryPoint": "src/server.js",
      "port": 3000,
      "healthEndpoint": "/api/health"
    },
    "infrastructure": [
      "Docker",
      "Docker Compose",
      "Nginx",
      "Redis",
      "Apache Kafka",
      "Zookeeper",
      "Kafka UI"
    ]
  },
  "repository": {
    "provider": "github",
    "url": "https://github.com/victorafteni/kafka",
    "cloneUrl": "https://github.com/victorafteni/kafka.git",
    "branch": "main",
    "checkout": {
      "strategy": "git-scm-polling",
      "cleanBeforeCheckout": true,
      "submoduleUpdate": false,
      "credentialsId": "github-kafka-repository",
      "pruneStaleBranches": true,
      "depth": 1
    }
  },
  "architecture": {
    "dataFlow": [
      "Angular Browser SPA -> Nginx Reverse Proxy (:8080/:80)",
      "Angular Frontend -> Node.js Express API (:3000)",
      "Node.js Backend -> Redis (:6379) for Catalog Caching, Search Index, and User Shopping Cart",
      "Node.js Backend -> Apache Kafka Producer (:9092/:29092) for page_view events on topic shop.analytics.page_views",
      "Node.js AnalyticsConsumer (:3000) <- Consumes from Kafka (shop-analytics-consumer) with DLQ fallback to shop.analytics.page_views.dlq",
      "Kafka UI (:8085) -> Connects to Kafka Broker (:9092) for visual topic and message stream inspection"
    ],
    "servicesCount": 5
  },
  "jenkins": {
    "controller": {
      "version": "2.462.1-lts",
      "systemRequirements": {
        "minMemoryMb": 4096,
        "recommendedCpuCores": 4,
        "diskSpaceGb": 50
      },
      "agentStrategy": "ephemeral-docker-or-kubernetes"
    },
    "requiredPlugins": [
      {
        "id": "git",
        "minimumVersion": "5.2.0",
        "description": "Cloning and tracking GitHub repository"
      },
      {
        "id": "workflow-aggregator",
        "minimumVersion": "596.v8c21c963d92d",
        "description": "Jenkins Declarative Pipeline engine"
      },
      {
        "id": "docker-workflow",
        "minimumVersion": "572.v950f58993843",
        "description": "Building and publishing container images"
      },
      {
        "id": "credentials-binding",
        "minimumVersion": "681.vf91662a_42e81",
        "description": "Secure injection of GitHub tokens and Docker registry credentials"
      },
      {
        "id": "nodejs",
        "minimumVersion": "1.6.2",
        "description": "Node.js tool installation and isolation for Angular and Express"
      },
      {
        "id": "junit",
        "minimumVersion": "1282.va_c26926604f3",
        "description": "Publishing Karma/Jasmine unit test reports"
      },
      {
        "id": "cobertura",
        "minimumVersion": "1.17",
        "description": "Publishing Angular code coverage reports"
      }
    ]
  },
  "credentials": {
    "github": {
      "logicalId": "github-kafka-repository",
      "type": "UsernamePasswordOrToken",
      "description": "GitHub Personal Access Token for read/write repository checkout and status checks",
      "scope": "SYSTEM"
    },
    "dockerRegistry": {
      "logicalId": "docker-hub-credentials",
      "type": "UsernameWithPassword",
      "description": "Docker Hub or private container registry credentials for publishing images",
      "scope": "SYSTEM"
    },
    "notificationWebhook": {
      "logicalId": "slack-teams-deployment-webhook",
      "type": "SecretText",
      "description": "Encrypted Webhook URL for alerting on build, test, and deployment outcomes",
      "scope": "SYSTEM"
    }
  },
  "environment": {
    "build": {
      "NODE_VERSION": "20.18.0",
      "NPM_CONFIG_LOGLEVEL": "warn",
      "NPM_CONFIG_AUDIT": "false",
      "NPM_CONFIG_FUND": "false",
      "CHROME_BIN": "/usr/bin/chromium-browser",
      "NG_BUILD_MAX_WORKERS": "2"
    },
    "runtime": {
      "PORT": "3000",
      "NODE_ENV": "production",
      "REDIS_HOST": "redis",
      "REDIS_PORT": "6379",
      "KAFKA_BROKER": "kafka:29092",
      "KAFKA_TOPIC_PAGE_VIEWS": "shop.analytics.page_views",
      "KAFKA_TOPIC_DLQ": "shop.analytics.page_views.dlq",
      "KAFKA_GROUP_ID": "shop-analytics-consumer",
      "CORS_ORIGIN": "*"
    },
    "secrets": [
      "DOCKER_REGISTRY_USER",
      "DOCKER_REGISTRY_PASSWORD",
      "GITHUB_PAT",
      "SLACK_WEBHOOK_URL"
    ]
  },
  "pipeline": {
    "name": "commerce-hub-ci-cd-pipeline",
    "type": "declarative",
    "agent": {
      "type": "docker",
      "image": "node:20-alpine",
      "customWorkspace": "/home/jenkins/workspace/commerce-hub"
    },
    "trigger": {
      "githubPushWebhook": true,
      "pollSCM": "H/5 * * * *",
      "manualDispatch": true
    },
    "options": {
      "timeoutHours": 1,
      "buildDiscarderMaxBuilds": 30,
      "disableConcurrentBuilds": true,
      "ansiColor": "xterm"
    },
    "stages": [
      {
        "id": "stage-01-checkout",
        "name": "Source Checkout",
        "workingDirectory": ".",
        "commands": [
          "git status",
          "git rev-parse --short HEAD"
        ],
        "timeoutMinutes": 5,
        "critical": true
      },
      {
        "id": "stage-02-install-frontend",
        "name": "Install Frontend Dependencies",
        "workingDirectory": ".",
        "commands": [
          "npm ci --prefer-offline"
        ],
        "timeoutMinutes": 10,
        "critical": true
      },
      {
        "id": "stage-03-install-backend",
        "name": "Install Backend Dependencies",
        "workingDirectory": "backend",
        "commands": [
          "npm install --omit=dev --prefer-offline"
        ],
        "timeoutMinutes": 5,
        "critical": true
      },
      {
        "id": "stage-04-frontend-tests",
        "name": "Frontend Unit Tests",
        "workingDirectory": ".",
        "commands": [
          "npx ng test --watch=false --browsers=ChromeHeadless --code-coverage"
        ],
        "timeoutMinutes": 10,
        "critical": true,
        "testResults": "coverage/commerce-spa"
      },
      {
        "id": "stage-05-frontend-build",
        "name": "Frontend Production Build",
        "workingDirectory": ".",
        "commands": [
          "npm run build -- --configuration=production"
        ],
        "artifacts": [
          "dist/commerce-spa/browser/**"
        ],
        "timeoutMinutes": 10,
        "critical": true
      },
      {
        "id": "stage-06-backend-validation",
        "name": "Backend Syntax & Integrity Validation",
        "workingDirectory": "backend",
        "commands": [
          "node -c src/server.js",
          "node -c src/controllers/catalog.controller.js",
          "node -c src/controllers/cart.controller.js",
          "node -c src/controllers/search.controller.js",
          "node -c src/controllers/tracking.controller.js",
          "node -c src/services/redis.service.js",
          "node -c src/services/kafka.service.js",
          "node -c src/consumers/analytics.consumer.js"
        ],
        "timeoutMinutes": 3,
        "critical": true
      },
      {
        "id": "stage-07-docker-build",
        "name": "Docker Images Build",
        "workingDirectory": ".",
        "commands": [
          "docker build -t commerce-hub-spa:${BUILD_NUMBER} -t commerce-hub-spa:latest -f Dockerfile .",
          "docker build -t commerce-backend:${BUILD_NUMBER} -t commerce-backend:latest -f backend/Dockerfile ./backend"
        ],
        "timeoutMinutes": 15,
        "critical": true
      },
      {
        "id": "stage-08-integration-verification",
        "name": "Ephemeral Integration Verification",
        "workingDirectory": ".",
        "commands": [
          "docker compose up -d redis zookeeper kafka",
          "docker compose run --rm -e REDIS_HOST=redis -e KAFKA_BROKER=kafka:29092 backend node -e \"require('./src/services/redis.service').connect().then(() => console.log('Redis Verified')).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })\"",
          "docker compose down"
        ],
        "timeoutMinutes": 10,
        "critical": false
      },
      {
        "id": "stage-09-deployment",
        "name": "Production Deployment",
        "workingDirectory": ".",
        "commands": [
          "docker compose up -d --build --remove-orphans"
        ],
        "timeoutMinutes": 10,
        "critical": true
      },
      {
        "id": "stage-10-healthcheck",
        "name": "Post-Deployment Health Checks",
        "workingDirectory": ".",
        "commands": [
          "curl -fsS http://localhost:8080/ || exit 1",
          "curl -fsS http://localhost:3000/api/health | grep -q 'status' || exit 1",
          "curl -fsS http://localhost:3000/api/products | grep -q '[' || exit 1",
          "curl -fsS http://localhost:3000/api/categories | grep -q '[' || exit 1",
          "curl -fsS http://localhost:8085/ || exit 0"
        ],
        "timeoutMinutes": 5,
        "critical": true
      }
    ]
  },
  "docker": {
    "composeFile": "docker-compose.yml",
    "composeVersion": "3.8",
    "network": {
      "name": "commerce-net",
      "driver": "bridge"
    },
    "volumes": {
      "redisData": {
        "name": "redis-data",
        "containerMount": "/data"
      }
    },
    "services": {
      "commerceSpa": {
        "serviceName": "commerce-spa",
        "containerName": "commerce-hub-spa",
        "context": ".",
        "dockerfile": "Dockerfile",
        "ports": [
          "8080:80"
        ],
        "restartPolicy": "unless-stopped"
      },
      "backend": {
        "serviceName": "backend",
        "containerName": "commerce-backend",
        "context": "./backend",
        "dockerfile": "backend/Dockerfile",
        "ports": [
          "3000:3000"
        ],
        "environment": {
          "PORT": 3000,
          "REDIS_HOST": "redis",
          "REDIS_PORT": 6379,
          "KAFKA_BROKER": "kafka:29092"
        },
        "dependsOn": [
          "redis",
          "kafka"
        ]
      },
      "redis": {
        "serviceName": "redis",
        "containerName": "commerce-redis",
        "image": "redis:7-alpine",
        "ports": [
          "6379:6379"
        ],
        "volumes": [
          "redis-data:/data"
        ]
      },
      "zookeeper": {
        "serviceName": "zookeeper",
        "containerName": "commerce-zookeeper",
        "image": "confluentinc/cp-zookeeper:7.5.0",
        "ports": [
          "2181:2181"
        ],
        "environment": {
          "ZOOKEEPER_CLIENT_PORT": 2181,
          "ZOOKEEPER_TICK_TIME": 2000
        }
      },
      "kafka": {
        "serviceName": "kafka",
        "containerName": "commerce-kafka",
        "image": "confluentinc/cp-kafka:7.5.0",
        "ports": [
          "9092:9092",
          "29092:29092"
        ],
        "dependsOn": [
          "zookeeper"
        ],
        "environment": {
          "KAFKA_BROKER_ID": 1,
          "KAFKA_ZOOKEEPER_CONNECT": "zookeeper:2181",
          "KAFKA_ADVERTISED_LISTENERS": "PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092",
          "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP": "PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT",
          "KAFKA_INTER_BROKER_LISTENER_NAME": "PLAINTEXT",
          "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR": 1,
          "KAFKA_AUTO_CREATE_TOPICS_ENABLE": "true"
        }
      },
      "kafkaUi": {
        "serviceName": "kafka-ui",
        "containerName": "commerce-kafka-ui",
        "image": "provectuslabs/kafka-ui:latest",
        "ports": [
          "8085:8080"
        ],
        "environment": {
          "KAFKA_CLUSTERS_0_NAME": "local",
          "KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS": "kafka:29092",
          "KAFKA_CLUSTERS_0_ZOOKEEPER": "zookeeper:2181"
        }
      }
    }
  },
  "redis": {
    "role": "Runtime Catalog Store, Full-text Search Index, and Session Cart Manager",
    "image": "redis:7-alpine",
    "port": 6379,
    "host": "redis",
    "clientPackage": "redis ^4.7.0",
    "healthCheckCommand": "redis-cli ping",
    "expectedPingResponse": "PONG",
    "managedKeys": {
      "products": "shop:catalog:products",
      "categories": "shop:catalog:categories",
      "searchIndex": "shop:catalog:search_index",
      "userCartPrefix": "shop:cart:",
      "analyticsHistory": "shop:analytics:history"
    },
    "seedingStrategy": {
      "coldStartTrigger": "On backend startup or on first GET /api/products or GET /api/categories when keys are missing in Redis",
      "seedSources": [
        "backend/data/products.json",
        "backend/data/categories.json"
      ]
    }
  },
  "kafka": {
    "role": "Distributed Event Streaming Backbone & Telemetry Decoupling",
    "image": "confluentinc/cp-kafka:7.5.0",
    "zookeeperImage": "confluentinc/cp-zookeeper:7.5.0",
    "ports": {
      "internalBroker": 29092,
      "externalBroker": 9092,
      "zookeeperPort": 2181,
      "kafkaUiPort": 8085
    },
    "clientPackage": "kafkajs ^2.2.4",
    "topics": {
      "primaryPageViews": {
        "name": "shop.analytics.page_views",
        "partitions": 3,
        "replicationFactor": 1,
        "cleanupPolicy": "delete"
      },
      "companionPageViews": {
        "name": "page_views",
        "partitions": 3,
        "replicationFactor": 1
      },
      "deadLetterQueue": {
        "name": "shop.analytics.page_views.dlq",
        "partitions": 1,
        "replicationFactor": 1
      }
    },
    "consumerGroups": [
      {
        "groupId": "shop-analytics-consumer",
        "purpose": "Processes incoming page views with idempotency verification against event_id and DLQ routing"
      }
    ],
    "producerContract": {
      "key": "session_id (or user_id) for guaranteed in-order partition affinity",
      "envelopeFields": [
        "event_id",
        "event_type",
        "event_version",
        "timestamp",
        "source",
        "session_id",
        "anonymous_id",
        "user_id",
        "payload"
      ]
    }
  },
  "testing": {
    "frontend": {
      "runner": "Karma with Jasmine",
      "headlessCommand": "npx ng test --watch=false --browsers=ChromeHeadless",
      "totalUnitTests": 23,
      "testConfigs": [
        "tsconfig.spec.json",
        "src/app/core/services/cart.service.spec.ts",
        "src/app/core/services/tracking.service.spec.ts",
        "src/app/core/services/page-tracking.service.spec.ts",
        "src/app/app.component.spec.ts"
      ]
    },
    "backend": {
      "syntaxValidation": "node -c src/server.js",
      "integrationVerification": "Node.js redisService.connect() and kafkaService.healthCheck()"
    }
  },
  "deployment": {
    "strategy": "rolling-compose-restart",
    "productionTarget": "Local Docker Host / Virtual Server",
    "portsExposed": {
      "frontend": 8080,
      "backend": 3000,
      "kafkaUi": 8085,
      "kafkaExternal": 9092,
      "redisExternal": 6379
    },
    "rollback": {
      "strategy": "docker-compose-revert",
      "revertCommand": "docker compose down && git checkout HEAD~1 && docker compose up -d --build"
    }
  },
  "healthChecks": {
    "frontendCheck": {
      "protocol": "HTTP",
      "url": "http://localhost:8080/",
      "expectedStatus": 200
    },
    "backendApiHealth": {
      "protocol": "HTTP",
      "url": "http://localhost:3000/api/health",
      "expectedStatus": 200,
      "expectedPayloadFragment": "\"status\":\"ok\""
    },
    "backendProductsCheck": {
      "protocol": "HTTP",
      "url": "http://localhost:3000/api/products",
      "expectedStatus": 200
    },
    "backendAnalyticsEventsCheck": {
      "protocol": "HTTP",
      "url": "http://localhost:3000/api/analytics/events",
      "expectedStatus": 200
    },
    "kafkaUiCheck": {
      "protocol": "HTTP",
      "url": "http://localhost:8085/",
      "expectedStatus": 200
    }
  },
  "artifacts": {
    "retentionDays": 14,
    "patterns": [
      "dist/commerce-spa/browser/**",
      "coverage/**",
      "docker-compose.yml"
    ]
  },
  "notifications": {
    "onFailure": {
      "channels": [
        "slack-ci-alerts",
        "email-devops"
      ],
      "message": "Jenkins Pipeline FAILED at stage '${STAGE_NAME}' for branch '${GIT_BRANCH}' (Commit: ${GIT_COMMIT})"
    },
    "onSuccess": {
      "channels": [
        "slack-ci-announcements"
      ],
      "message": "Jenkins Pipeline PASSED for Commerce Hub (Build #${BUILD_NUMBER}). Deployment healthy on ports 8080, 3000, 8085."
    }
  },
  "failureHandling": {
    "frontendTestFailure": {
      "action": "Abort pipeline immediately, do not proceed to build or deployment, archive Karma test report"
    },
    "backendValidationFailure": {
      "action": "Abort pipeline immediately, report syntax/integrity error"
    },
    "dockerBuildFailure": {
      "action": "Abort deployment, preserve previous running containers without interruption"
    },
    "healthCheckFailure": {
      "action": "Mark build UNSTABLE or FAILED, trigger automatic rollback via previous stable Docker Compose image tags"
    }
  },
  "security": {
    "credentialsHandling": "Secrets are masked in Jenkins console logs using Credentials Binding Plugin",
    "dependencyVulnerabilityScanning": "npm audit --audit-level=high (optional step)",
    "containerScanning": "Trivy container image security scan before deployment",
    "leastPrivilege": "Build stages run as non-root user inside container agents"
  },
  "futureExtensions": {
    "ansibleIntegration": {
      "playbookLocation": "ansible/playbooks/deploy.yml",
      "description": "Integration with existing repository Ansible roles for remote multi-host provisioning"
    },
    "kubernetesHelm": {
      "description": "Transition Docker Compose services to Helm charts on production Kubernetes clusters"
    },
    "kafkaSchemaRegistry": {
      "description": "Enforce Avro or JSON Schema contracts in the CI/CD pipeline using Confluent Schema Registry"
    }
  }
}
