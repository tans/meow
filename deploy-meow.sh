#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-139.224.105.241}"
REMOTE_USER="${REMOTE_USER:-root}"
SSH_KEY="${SSH_KEY:-$SCRIPT_DIR/ssh/139.224.105.241_20260404233402_id_rsa}"
REMOTE_PATH="${REMOTE_PATH:-/data/meow}"
DOMAIN="${DOMAIN:-https://meow.ali.minapp.xin}"
ENTRY_PORT="${ENTRY_PORT:-26401}"
API_PORT="${API_PORT:-26411}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

check_deps() {
  log_step "检查部署依赖"
  for cmd in bun ssh scp tar; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_error "$cmd 未安装"
      exit 1
    fi
  done
  if [ ! -f "$SSH_KEY" ]; then
    log_error "SSH key 不存在: $SSH_KEY"
    exit 1
  fi
}

run_local_checks() {
  log_step "运行本地验证"
  cd "$SCRIPT_DIR"
  bun test apps/api/server.test.js
  bun test apps/entry/server.test.js
}

upload_release() {
  log_step "打包并上传当前版本"
  cd "$SCRIPT_DIR"

  local stamp bundle remote_bundle
  stamp="$(date +%Y%m%d_%H%M%S)"
  bundle="/tmp/meow-bun-${stamp}.tar.gz"
  remote_bundle="/tmp/meow-bun-${stamp}.tar.gz"

  tar -czf "$bundle" \
    apps/api \
    apps/entry \
    apps/www \
    apps/admin \
    apps/buyer \
    apps/square \
    packages/contracts \
    packages/database \
    packages/domain-core \
    packages/domain-finance \
    packages/domain-risk \
    packages/domain-task \
    packages/domain-user \
    packages/storage \
    package.json \
    README.md \
    RTK.md

  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$bundle" "$REMOTE_USER@$REMOTE_HOST:$remote_bundle"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "
    mkdir -p '$REMOTE_PATH/shared/uploads' '$REMOTE_PATH/shared/data' '$REMOTE_PATH/releases/$stamp' &&
    tar -xzf '$remote_bundle' -C '$REMOTE_PATH/releases/$stamp' &&
    rm -f '$remote_bundle' &&
    ln -sfn '$REMOTE_PATH/releases/$stamp' '$REMOTE_PATH/current'
  "

  rm -f "$bundle"
}

configure_processes() {
  log_step "配置远端 PM2 进程"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "
    cat > '$REMOTE_PATH/current/ecosystem.config.cjs' <<'EOF'
module.exports = {
  apps: [
    {
      name: 'meow-api',
      script: 'bun',
      args: 'run server.js',
      cwd: '$REMOTE_PATH/current/apps/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        API_PORT: '$API_PORT',
        MEOW_DB_PATH: '$REMOTE_PATH/shared/data/meow.sqlite',
        MEOW_UPLOAD_DIR: '$REMOTE_PATH/shared/uploads',
        MEOW_DEMO_AUTH: 'true',
        MEOW_DEMO_SEED: 'true'
      }
    },
    {
      name: 'meow-entry',
      script: 'bun',
      args: 'run server.js',
      cwd: '$REMOTE_PATH/current/apps/entry',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        ENTRY_PORT: '$ENTRY_PORT',
        API_PORT: '$API_PORT',
        MEOW_APP_ROOT: '$REMOTE_PATH/current'
      }
    }
  ]
};
EOF
    cd '$REMOTE_PATH/current' &&
    pm2 start ecosystem.config.cjs --update-env &&
    pm2 save
  "
}

verify_remote() {
  log_step "验证远端服务"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "
    curl -fsS 'http://127.0.0.1:$ENTRY_PORT/api/health' &&
    curl -fsS 'http://127.0.0.1:$ENTRY_PORT/' >/dev/null &&
    curl -fsS 'http://127.0.0.1:$ENTRY_PORT/square/' >/dev/null &&
    curl -fsS 'http://127.0.0.1:$ENTRY_PORT/admin/' >/dev/null &&
    curl -fsS 'http://127.0.0.1:$ENTRY_PORT/buyer/' >/dev/null
  "

  log_info "部署验证完成"
  log_info "入口地址: $DOMAIN"
  log_info "健康检查: $DOMAIN/api/health"
}

main() {
  local mode="${1:-all}"
  check_deps

  case "$mode" in
    all)
      run_local_checks
      upload_release
      configure_processes
      verify_remote
      ;;
    deploy)
      upload_release
      configure_processes
      verify_remote
      ;;
    verify)
      verify_remote
      ;;
    *)
      log_error "未知命令: $mode"
      echo "用法: ./deploy-meow.sh [all|deploy|verify]"
      exit 1
      ;;
  esac
}

main "$@"
