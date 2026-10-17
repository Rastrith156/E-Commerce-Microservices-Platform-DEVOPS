pipeline {
    agent { label 'linux-docker' }

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }

    environment {
        REPORTS = 'reports'
        TRIVY_VERSION = '0.61.1'
        GITLEAKS_VERSION = 'v8.24.2'
        DOCKER_CONFIG = "${WORKSPACE}/.docker-config"
    }

    stages {
        stage('Checkout and validate PR') {
            steps {
                deleteDir()
                checkout scm
                sh '''
                    set -eu
                    mkdir -p "$REPORTS"
                    : > "$REPORTS/images.env"
                    git rev-parse --verify HEAD
                    test "$(git rev-parse --is-shallow-repository)" = false || {
                      echo "A full clone is required for the Gitleaks history scan" >&2
                      exit 1
                    }
                    branch="${CHANGE_BRANCH:-${BRANCH_NAME:-$(git symbolic-ref --quiet --short HEAD || git branch -r --contains HEAD | sed -n 's#^[[:space:]]*origin/##p' | head -n 1)}}"
                    test -n "$branch" || { echo "Unable to determine the checked-out branch" >&2; exit 1; }
                    {
                      printf 'commit=%s\n' "$(git rev-parse HEAD)"
                      printf 'branch=%s\n' "$branch"
                      printf 'build_number=%s\n' "$BUILD_NUMBER"
                      printf 'change_id=%s\n' "${CHANGE_ID:-none}"
                      printf 'change_target=%s\n' "${CHANGE_TARGET:-none}"
                    } > "$REPORTS/build-metadata.txt"
                    case "$branch" in
                      main|develop|feature/*|fix/*|release/*|hotfix/*) ;;
                      *) echo "Branch is not allowed by CI policy: $branch" >&2; exit 1 ;;
                    esac
                    if [ -n "${CHANGE_ID:-}" ]; then
                      test -n "${CHANGE_TARGET:-}" || { echo "Pull request target is missing" >&2; exit 1; }
                      git fetch --no-tags origin "+refs/heads/${CHANGE_TARGET}:refs/remotes/origin/${CHANGE_TARGET}"
                      git merge-base --is-ancestor "origin/${CHANGE_TARGET}" HEAD || {
                        echo "PR branch must include the current target branch; rebase or merge it before validation" >&2
                        exit 1
                      }
                    fi
                    docker compose config --quiet
                '''
            }
        }

        stage('Secret detection') {
            steps {
                sh '''
                    set -eu
                    mkdir -p "$WORKSPACE/reports"

                    docker run --rm -v "$WORKSPACE:/repo" -w /repo \
                      "zricethezav/gitleaks:${GITLEAKS_VERSION}" \
                      git --redact --exit-code 1 --report-format sarif \
                      --report-path /repo/reports/gitleaks-history.sarif .
                    docker run --rm -v "$WORKSPACE:/repo" -w /repo \
                      "zricethezav/gitleaks:${GITLEAKS_VERSION}" \
                      dir --redact --exit-code 1 --report-format sarif \
                      --report-path /repo/reports/gitleaks-working-tree.sarif .
                '''
            }
        }

        stage('Install reproducible dependencies') {
            steps {
                sh '''
                    set -eu
                    docker run --rm -v "$WORKSPACE/frontend:/workspace" -w /workspace \
                      node:24.15.0-alpine3.22 sh -ec 'npm ci --ignore-scripts=false'
                    for service in catalog-service cart-service order-service; do
                      docker run --rm -v "$WORKSPACE:/workspace" -w "/workspace/services/$service" \
                        maven:3.9.9-eclipse-temurin-21-alpine \
                        mvn -B -ntp -C dependency:go-offline
                    done
                '''
            }
        }

        stage('Frontend lint and production build') {
            steps {
                sh '''
                    set -eu
                    docker run --rm -v "$WORKSPACE/frontend:/workspace" -w /workspace \
                      node:24.15.0-alpine3.22 sh -ec 'npm run lint && npm run build'
                '''
            }
        }

        stage('Backend compile and unit tests') {
            steps {
                sh '''
                    set -eu
                    for service in catalog-service cart-service order-service; do
                      docker run --rm -v "$WORKSPACE:/workspace" -w "/workspace/services/$service" \
                        maven:3.9.9-eclipse-temurin-21-alpine \
                        mvn -B -ntp -C verify
                    done
                '''
            }
            post {
                always {
                    junit testResults: 'services/*/target/surefire-reports/TEST-*.xml',
                          allowEmptyResults: false
                }
            }
        }

        stage('SonarQube analysis and quality gate') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sonarqube') {
                        sh """
                            set -eu
                            '${scannerHome}/bin/sonar-scanner' -Dsonar.qualitygate.wait=true
                        """
                    }
                }
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Filesystem and dependency scan') {
            steps {
                sh '''
                    set -eu
                    docker run --rm -v "$WORKSPACE:/workspace" -w /workspace \
                      "aquasec/trivy:${TRIVY_VERSION}" fs \
                      --config trivy.yaml --scanners vuln,misconfig,secret \
                      --severity HIGH,CRITICAL --exit-code 1 \
                      --format sarif --output reports/trivy-fs.sarif .
                '''
            }
        }

        stage('Build deployable images') {
            steps {
                sh '''
                    set -eu
                    for service in catalog-service cart-service order-service; do
                      docker build --pull \
                        --label "org.opencontainers.image.revision=$(git rev-parse HEAD)" \
                        --tag "ecommerce/${service}:ci-${BUILD_NUMBER}" \
                        --file "services/${service}/Dockerfile" "services/${service}"
                    done
                    docker build --pull \
                      --label "org.opencontainers.image.revision=$(git rev-parse HEAD)" \
                      --tag "ecommerce/frontend:ci-${BUILD_NUMBER}" \
                      --file frontend/Dockerfile frontend
                '''
            }
        }

        stage('Image scan and SBOM generation') {
            steps {
                sh '''
                    set -eu
                    for image in catalog-service cart-service order-service frontend; do
                      ref="ecommerce/${image}:ci-${BUILD_NUMBER}"
                      docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                        -v "$WORKSPACE:/workspace" -w /workspace \
                        "aquasec/trivy:${TRIVY_VERSION}" image \
                        --config trivy.yaml --severity HIGH,CRITICAL --exit-code 1 \
                        --format sarif --output "reports/trivy-${image}.sarif" "$ref"
                      docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                        -v "$WORKSPACE:/workspace" -w /workspace \
                        "aquasec/trivy:${TRIVY_VERSION}" image \
                        --config trivy.yaml --format cyclonedx \
                        --output "reports/${image}.cdx.json" "$ref"
                    done
                '''
            }
        }

        stage('Smoke test composed application') {
            steps {
                sh '''
                    set -eu
                    export COMPOSE_PROJECT_NAME="ecommerce-${BUILD_NUMBER}"
                    export CATALOG_HOST_PORT=$((30000 + BUILD_NUMBER % 1000))
                    export CART_HOST_PORT=$((31000 + BUILD_NUMBER % 1000))
                    export ORDER_HOST_PORT=$((32000 + BUILD_NUMBER % 1000))
                    export FRONTEND_HOST_PORT=$((33000 + BUILD_NUMBER % 1000))
                    export CATALOG_IMAGE="ecommerce/catalog-service:ci-${BUILD_NUMBER}"
                    export CART_IMAGE="ecommerce/cart-service:ci-${BUILD_NUMBER}"
                    export ORDER_IMAGE="ecommerce/order-service:ci-${BUILD_NUMBER}"
                    export FRONTEND_IMAGE="ecommerce/frontend:ci-${BUILD_NUMBER}"
                    cleanup() { docker compose down --volumes --remove-orphans; }
                    trap cleanup EXIT
                    docker compose up --detach --no-build
                    for attempt in $(seq 1 60); do
                      if curl --fail --silent "http://127.0.0.1:${FRONTEND_HOST_PORT}/" >/dev/null \
                         && curl --fail --silent "http://127.0.0.1:${CATALOG_HOST_PORT}/api/products" >/dev/null \
                         && curl --fail --silent "http://127.0.0.1:${CATALOG_HOST_PORT}/actuator/prometheus" \
                           | grep -q 'http_server_requests_seconds' \
                         && curl --fail --silent "http://127.0.0.1:${CART_HOST_PORT}/api/carts/ci-smoke" >/dev/null \
                         && curl --fail --silent "http://127.0.0.1:${ORDER_HOST_PORT}/api/payments/paypal/status" >/dev/null; then
                        echo "All four application endpoints passed smoke checks"
                        exit 0
                      fi
                      sleep 2
                    done
                    docker compose logs --no-color
                    echo "Application smoke test timed out" >&2
                    exit 1
                '''
            }
        }

        stage('Push verified immutable images') {
            when { branch 'main' }
            steps {
                script {
                    if (!env.IMAGE_REGISTRY?.trim()) {
                        error('IMAGE_REGISTRY must be configured for trusted main-branch publishing')
                    }
                }
                withCredentials([usernamePassword(credentialsId: 'artifact-registry-writer',
                                  usernameVariable: 'REGISTRY_USERNAME',
                                  passwordVariable: 'REGISTRY_PASSWORD')]) {
                    sh '''
                        set +x
                        set -eu
                        mkdir -p "$DOCKER_CONFIG"
                        printf '%s' "$REGISTRY_PASSWORD" |
                          docker login "${IMAGE_REGISTRY%%/*}" \
                            --username "$REGISTRY_USERNAME" --password-stdin
                        mkdir -p "$REPORTS"
                        : > "$REPORTS/images.env"
                        commit="$(git rev-parse HEAD)"
                        for service in catalog-service cart-service order-service frontend; do
                          local_ref="ecommerce/${service}:ci-${BUILD_NUMBER}"
                          remote_ref="${IMAGE_REGISTRY}/${service}:git-${commit}"
                          docker tag "$local_ref" "$remote_ref"
                          docker push "$remote_ref"
                          digest="$(docker buildx imagetools inspect "$remote_ref" --format '{{.Digest}}')"
                          printf '%s\n' "$digest" | grep -Eq '^sha256:[0-9a-f]{64}$'
                          printf '%s=%s@%s\n' "$service" "${IMAGE_REGISTRY}/${service}" "$digest" \
                            >> "$REPORTS/images.env"
                        done
                    '''
                }
            }
        }

        stage('Sign and verify published digests') {
            when { branch 'main' }
            steps {
                withCredentials([string(credentialsId: 'cosign-oidc-token',
                                        variable: 'SIGSTORE_ID_TOKEN')]) {
                    sh '''
                        set +x
                        set -eu
                        command -v cosign >/dev/null
                        test -n "${COSIGN_CERTIFICATE_IDENTITY:-}" || {
                          echo "COSIGN_CERTIFICATE_IDENTITY must be configured" >&2; exit 1;
                        }
                        test -n "${COSIGN_OIDC_ISSUER:-}" || {
                          echo "COSIGN_OIDC_ISSUER must be configured" >&2; exit 1;
                        }
                        while IFS='=' read -r service image; do
                          cosign sign --yes "$image"
                          cosign verify \
                            --certificate-identity "$COSIGN_CERTIFICATE_IDENTITY" \
                            --certificate-oidc-issuer "$COSIGN_OIDC_ISSUER" \
                            "$image" > "reports/cosign-${service}.json"
                          printf '%s=%s\n' "$service" "$image" >> reports/verified-images.txt
                        done < reports/images.env
                    '''
                }
            }
        }

        stage('Open GitOps dev promotion PR') {
            when { branch 'main' }
            steps {
                script {
                    if (!env.GITOPS_REPOSITORY?.trim()) {
                        error('GITOPS_REPOSITORY must point to the separate GitOps repository')
                    }
                }
                withCredentials([string(credentialsId: 'gitops-github-token',
                                        variable: 'GITOPS_TOKEN')]) {
                    sh '''
                        set +x
                        set -eu
                        export GH_TOKEN="$GITOPS_TOKEN"
                        export GIT_ASKPASS="$WORKSPACE/.git-askpass"
                        cat > "$GIT_ASKPASS" <<'ASKPASS'
#!/bin/sh
case "$1" in
  *Username*) printf '%s\n' x-access-token ;;
  *Password*) printf '%s\n' "$GITOPS_TOKEN" ;;
esac
ASKPASS
                        chmod 700 "$GIT_ASKPASS"
                        mkdir -p "$WORKSPACE/tmp"
                        repo_dir="$WORKSPACE/tmp/gitops-promotion-${BUILD_NUMBER}"
                        trap 'rm -rf "$repo_dir"' EXIT
                        gitops_base="${GITOPS_BASE_BRANCH:-main}"
                        git clone --branch "$gitops_base" "$GITOPS_REPOSITORY" "$repo_dir"
                        cd "$repo_dir"
                        branch="ci/dev-$(git -C "$WORKSPACE" rev-parse --short HEAD)"
                        if git ls-remote --exit-code --heads origin "refs/heads/$branch" >/dev/null 2>&1; then
                          git fetch origin "refs/heads/$branch:refs/remotes/origin/$branch"
                          git switch --track --create "$branch" "origin/$branch"
                        else
                          git switch --create "$branch"
                        fi
                        while IFS='=' read -r service image; do
                          registry="${image%@*}"
                          digest="${image##*@}"
                          sed -i "/name: ${service}$/,+2 { /newName:/s|.*|  newName: ${registry}|; /digest:/s|.*|  digest: ${digest}|; }" \
                            environments/dev/kustomization.yaml
                        done < "$WORKSPACE/reports/verified-images.txt"
                        if ! git diff --quiet; then
                          git config user.name 'Jenkins CI'
                          git config user.email 'jenkins-ci@users.noreply.github.com'
                          git add environments/dev/kustomization.yaml
                          git commit -m "chore(dev): promote verified ${branch#ci/dev-}"
                          git push --set-upstream origin "$branch"
                        fi
                        if git diff --quiet "origin/$gitops_base" -- environments/dev/kustomization.yaml; then
                          echo "GitOps dev already references these verified digests."
                          exit 0
                        fi
                        open_prs="$(gh pr list --head "$branch" --state open --json number --jq 'length')"
                        if [ "$open_prs" = "0" ]; then
                          gh pr create --base "$gitops_base" --head "$branch" \
                            --title "Promote verified build to dev" \
                            --body "Automated promotion from CI. Image digests are in the committed Kustomize overlay. Staging and production require separate reviewed promotion PRs."
                        else
                          echo "Updated existing GitOps promotion PR for $branch."
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                set -eu
                if [ -d "$DOCKER_CONFIG" ]; then
                  logout_status=0
                  if [ -n "${IMAGE_REGISTRY:-}" ]; then
                    docker logout "${IMAGE_REGISTRY%%/*}" || logout_status=$?
                  fi
                  rm -rf "$DOCKER_CONFIG"
                  test "$logout_status" -eq 0
                fi
            '''
            archiveArtifacts artifacts: 'reports/**,frontend/dist/**,services/*/target/surefire-reports/**',
                             allowEmptyArchive: true, fingerprint: true
        }
        failure {
            echo 'CI FAILED: inspect stage logs and archived reports; no unverified image is promoted.'
        }
    }
}
