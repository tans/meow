#!/bin/bash
#
# meow.ali.minapp.xin 部署脚本
# 部署: /square (用户端) /admin (管理后台) /api (后端接口)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 配置
REMOTE_HOST="139.224.105.241"
REMOTE_USER="root"
NGINX_WWW_HOST="/opt/1panel/apps/openresty/openresty/www"
REMOTE_PATH="$NGINX_WWW_HOST/sites/meow.ali.minapp.xin"
SSH_KEY="${SSH_KEY:-./ssh/139.224.105.241_20260404233402_id_rsa}"
DOMAIN="https://meow.ali.minapp.xin"
API_PORT=26411
ENTRY_PORT=26401

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

# 检查依赖
check_deps() {
    log_step "检查依赖..."
    for cmd in pnpm scp ssh; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd 未安装"
            exit 1
        fi
    done
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key 不存在: $SSH_KEY"
        exit 1
    fi
    log_info "依赖检查通过"
}

# 构建项目
build_project() {
    log_step "开始构建项目..."
    cd "$SCRIPT_DIR"

    log_info "清理旧构建..."
    rm -rf apps/square/dist apps/admin/dist apps/www/dist apps/api/dist apps/entry/dist
    rm -f apps/square/tsconfig.tsbuildinfo apps/admin/tsconfig.tsbuildinfo apps/www/tsconfig.tsbuildinfo apps/api/tsconfig.tsbuildinfo apps/entry/tsconfig.tsbuildinfo

    log_info "安装依赖..."
    pnpm install

    log_info "构建 Contracts..."
    pnpm --filter @meow/contracts build

    log_info "构建 Square (用户端)..."
    pnpm --filter @meow/square build

    log_info "构建 Admin (管理后台)..."
    pnpm --filter @meow/admin build

    log_info "构建 WWW (落地页)..."
    pnpm --filter @meow/www build

    log_info "构建 API..."
    pnpm --filter @meow/api build

    log_info "构建 Entry (统一入口)..."
    pnpm --filter @meow/entry build

    log_info "构建完成"
}

# 修复静态资源路径
fix_paths() {
    log_step "修复静态资源路径..."
    cd "$SCRIPT_DIR"

    # Square: base 是 /square/
    if [ -f "apps/square/dist/index.html" ]; then
        sed -i.bak 's|src="/assets/|src="./assets/|g; s|href="/assets/|href="./assets/|g' apps/square/dist/index.html
        rm -f apps/square/dist/index.html.bak
        log_info "Square index.html 路径已修复"
    fi

    # Admin: base 是 /admin/
    if [ -f "apps/admin/dist/index.html" ]; then
        sed -i.bak 's|src="/admin/assets/|src="./assets/|g; s|href="/admin/assets/|href="./assets/|g' apps/admin/dist/index.html
        rm -f apps/admin/dist/index.html.bak
        log_info "Admin index.html 路径已修复"
    fi

    # WWW: 落地页，资源路径 /assets/，但 served at / 所以用 ./
    if [ -f "apps/www/dist/index.html" ]; then
        sed -i.bak 's|src="/assets/|src="./assets/|g; s|href="/assets/|href="./assets/|g' apps/www/dist/index.html
        rm -f apps/www/dist/index.html.bak
        log_info "WWW index.html 路径已修复"
    fi
}

# 部署目录到服务器
deploy_dir() {
    local local_dir="$1"
    local remote_dir="$2"
    local name="$3"
    local abs_local_dir="$SCRIPT_DIR/$local_dir"

    log_info "上传 $name ..."

    local tmp_tar="/tmp/deploy_$(echo "$name" | tr -cd 'a-zA-Z0-9' | tr 'A-Z' 'a-z')_$(date +%s).tar.gz"

    tar -czf "$tmp_tar" -C "$abs_local_dir" .
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$tmp_tar" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

    local tar_name
    tar_name=$(basename "$tmp_tar")
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "mkdir -p $remote_dir && rm -rf $remote_dir/* && tar -xzf /tmp/$tar_name -C $remote_dir && rm -f /tmp/$tar_name && chmod -R 755 $remote_dir"

    rm -f "$tmp_tar"
    log_info "$name 上传完成"
}

# 部署静态文件
deploy_static() {
    log_step "部署静态文件..."

    # 备份
    local ts
    ts=$(date +%Y%m%d_%H%M%S)
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "[ -d \"$REMOTE_PATH/square\" ] && mv $REMOTE_PATH/square $REMOTE_PATH/square.backup.$ts || true
         [ -d \"$REMOTE_PATH/admin\" ] && mv $REMOTE_PATH/admin $REMOTE_PATH/admin.backup.$ts || true
         echo '备份完成'" || log_warn "备份步骤出现问题，继续部署..."

    # 落地页 www.html -> 根目录 index.html
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        "$SCRIPT_DIR/www.html" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/index.html"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "chmod 644 $REMOTE_PATH/index.html"
    log_info "落地页 (www.html) 已部署"

    # Square -> /square/
    deploy_dir "apps/square/dist" "$REMOTE_PATH/square" "Square"

    # Admin -> /admin/
    deploy_dir "apps/admin/dist" "$REMOTE_PATH/admin" "Admin"
}

# 部署 API
deploy_api() {
    log_step "部署 API..."

    local api_dir="/data/meow"

    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "mkdir -p $api_dir/shared/data $api_dir/shared/logs"

    log_info "上传 API..."
    # Bundle @meow/* packages into API dist so they're available at runtime
    mkdir -p apps/api/dist/node_modules/@meow
    for pkg in packages/*/dist; do
      pkg_name=$(basename "$(dirname \"$pkg\")")
      mkdir -p "apps/api/dist/node_modules/@meow/$pkg_name"
      cp -r "$pkg/"* "apps/api/dist/node_modules/@meow/$pkg_name/"
    done
    scp -r -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        apps/api/dist "$REMOTE_USER@$REMOTE_HOST:$api_dir/current_dist"
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        apps/api/package.json "$REMOTE_USER@$REMOTE_HOST:$api_dir/package.json"

    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "cd $api_dir && rm -rf current && mkdir -p current && mv current_dist/* current/ && mv package.json current/ && rm -rf current_dist && cd current && sed -i 's|"workspace:\*|"*"|g' package.json && npm install --legacy-peer-deps && chmod +x index.js" \
        || { log_error "API 安装失败"; return 1; }

    # PM2 配置 (通过 printf 写入，避免 heredoc 问题)
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "cd $api_dir/current && printf '%s\n' 'module.exports = {' '  apps: [' '    {' '      name: '\''meow-api'\'',' '      script: '\''./index.js'\'',' '      interpreter: '\''node'\'',' '      instances: 1,' '      exec_mode: '\''fork'\'',' '      autorestart: true,' '      watch: false,' '      env: {' '        PORT: $API_PORT,' '        MEOW_DB_PATH: '\''$api_dir/shared/data/meow.sqlite'\'',' '        MEOW_COOKIE_SECURE: '\''true'\'',' '        MEOW_DEMO_AUTH: '\''true'\'',' '        MEOW_DEMO_SEED: '\''true'\''' '      }' '    }' '  ]' '};' > ecosystem.config.cjs && chmod +x ecosystem.config.cjs"

    # 重启
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "cd $api_dir/current && pm2 stop meow-api 2>/dev/null || true && pm2 start ecosystem.config.cjs && pm2 save"

    log_info "API 部署完成 (端口 $API_PORT)"
}

# 配置 Nginx
configure_nginx() {
    log_step "配置 Nginx..."

    local container_id="3cbbfa1dd0c0"  # openresty container

    # 本地写入 nginx 配置，然后 scp 上传
    cat > /tmp/meow_nginx_root.conf << 'NGINXEOF'
location /api/ {
    rewrite ^/api(.*)$ $1 break;
    proxy_pass http://127.0.0.1:API_PORT;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location /square/ {
    alias REMOTE_PATH/square/;
    index index.html;
    try_files $uri $uri/ /square/index.html;
}

location /admin/ {
    alias REMOTE_PATH/admin/;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}

location / {
    root REMOTE_PATH;
    index index.html;
    try_files $uri $uri/ /index.html;
}
NGINXEOF

    # 替换占位符
    sed -i.bak \
        -e "s/API_PORT/$API_PORT/g" \
        -e "s|REMOTE_PATH|$REMOTE_PATH|g" \
        /tmp/meow_nginx_root.conf
    rm -f /tmp/meow_nginx_root.conf.bak

    # 确保 proxy 目录存在，再上传配置
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "mkdir -p $REMOTE_PATH/proxy"

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        /tmp/meow_nginx_root.conf "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/proxy/root.conf"
    rm -f /tmp/meow_nginx_root.conf

    # 重新加载 nginx (openresty in docker)
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "docker exec $container_id /usr/local/openresty/bin/openresty -t && docker exec $container_id /usr/local/openresty/bin/openresty -s reload"

    log_info "Nginx 配置完成"
}

# 验证部署
verify_deployment() {
    log_step "验证部署..."

    local failed=0

    check_url() {
        local path="$1"
        local name="$2"
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$path")
        if [ "$status" = "200" ]; then
            log_info "✓ $name: 200 OK"
        else
            log_error "✗ $name: HTTP $status"
            failed=1
        fi
    }

    check_url "/" "Landing (/)"
    check_url "/square/" "Square (/square/)"
    check_url "/admin/" "Admin (/admin/)"
    check_url "/api/health" "API (/api/health)"

    [ $failed -eq 0 ] && log_info "所有验证通过!" || log_error "部分验证失败"
    return $failed
}

# 清理备份
cleanup_backups() {
    log_step "清理旧备份..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" \
        "find $REMOTE_PATH -maxdepth 1 -name '*.backup.*' -type d -mtime +3 -exec rm -rf {} + 2>/dev/null || true; echo '清理完成'"
}

# 使用说明
usage() {
    cat << EOF
╔══════════════════════════════════════════════════════════╗
║     meow.ali.minapp.xin 部署脚本                          ║
╚══════════════════════════════════════════════════════════╝

用法: $0 [命令] [选项]

命令:
    all           完整部署 (构建 + 部署 + 验证)
    build         仅构建
    deploy        仅部署静态文件和API
    api           仅部署 API
    verify        验证部署状态
    clean         清理备份

选项:
    --skip-build     跳过构建
    --skip-verify    跳过验证
    --help, -h       显示帮助

示例:
    $0 all                    # 完整部署
    $0 deploy --skip-build     # 仅部署
    $0 verify                  # 验证

访问地址:
    Landing: $DOMAIN/
    Square:  $DOMAIN/square/
    Admin:   $DOMAIN/admin/
    API:     $DOMAIN/api/
EOF
}

main() {
    local cmd="${1:-all}"
    local skip_build=false
    local skip_verify=false

    for arg in "$@"; do
        case $arg in
            --skip-build) skip_build=true ;;
            --skip-verify) skip_verify=true ;;
            --help|-h) usage; exit 0 ;;
        esac
    done

    case $cmd in
        all)
            check_deps
            if [ "$skip_build" = false ]; then
                build_project
                fix_paths
            fi
            deploy_static
            deploy_api
            configure_nginx
            if [ "$skip_verify" = false ]; then
                verify_deployment || true
            fi
            cleanup_backups
            log_info "部署完成!"
            echo ""
            echo "访问地址:"
            echo "  Landing: $DOMAIN/"
            echo "  Square:  $DOMAIN/square/"
            echo "  Admin:   $DOMAIN/admin/"
            echo "  API:     $DOMAIN/api/"
            ;;
        build)
            check_deps
            build_project
            fix_paths
            log_info "构建完成"
            ;;
        deploy)
            check_deps
            deploy_static
            deploy_api
            configure_nginx
            ;;
        api)
            check_deps
            if [ "$skip_build" = false ]; then
                build_project
            fi
            deploy_api
            configure_nginx
            ;;
        verify)
            verify_deployment
            ;;
        clean)
            check_deps
            cleanup_backups
            ;;
        *)
            log_error "未知命令: $cmd"
            usage
            exit 1
            ;;
    esac
}

main "$@"
