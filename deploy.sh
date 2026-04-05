#!/bin/bash
#
# 创意喵平台部署脚本
# 部署流程: 构建 -> 修复路径 -> 上传 -> 验证
#

set -e  # 遇到错误立即退出

# 配置
REMOTE_HOST="139.224.105.241"
REMOTE_USER="root"
REMOTE_PATH="/www/sites/meow.ali.minapp.xin"
SSH_KEY="${SSH_KEY:-./ssh/139.224.105.241_20260404233402_id_rsa}"
DOMAIN="https://miao.ali.minapp.xin"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查依赖
check_deps() {
    log_step "检查依赖..."
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装"
        exit 1
    fi
    
    if ! command -v scp &> /dev/null; then
        log_error "scp 未安装"
        exit 1
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key 不存在: $SSH_KEY"
        exit 1
    fi
    
    log_info "依赖检查通过"
}

# 构建项目
build_project() {
    log_step "开始构建项目..."
    
    # 清理旧构建
    log_info "清理旧构建..."
    rm -rf apps/admin/dist apps/web/dist
    
    # 安装依赖
    log_info "安装依赖..."
    pnpm install
    
    # 构建 contracts (依赖)
    log_info "构建 Contracts..."
    pnpm --filter @meow/contracts build
    
    # 构建 admin
    log_info "构建 Admin 应用..."
    cd apps/admin
    pnpm build
    cd ../..
    
    # 构建 web
    log_info "构建 Web 应用..."
    cd apps/web
    pnpm build
    cd ../..
    
    log_info "构建完成"
}

# 修复路径 (将绝对路径改为相对路径)
fix_paths() {
    log_step "修复静态资源路径..."
    
    # 修复 admin index.html
    if [ -f "apps/admin/dist/index.html" ]; then
        sed -i.bak 's|src="/assets/|src="./assets/|g; s|href="/assets/|href="./assets/|g' apps/admin/dist/index.html
        rm -f apps/admin/dist/index.html.bak
        log_info "Admin index.html 路径已修复"
    fi
    
    # 修复 web index.html
    if [ -f "apps/web/dist/index.html" ]; then
        sed -i.bak 's|src="/assets/|src="./assets/|g; s|href="/assets/|href="./assets/|g' apps/web/dist/index.html
        rm -f apps/web/dist/index.html.bak
        log_info "Web index.html 路径已修复"
    fi
}

# 使用 tar + scp 部署目录
deploy_dir() {
    local local_dir="$1"
    local remote_dir="$2"
    local name="$3"
    
    log_info "上传 $name ..."
    
    local ssh_opts="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    
    # 打包
    local tmp_tar="/tmp/${name}_$(date +%s).tar.gz"
    tar -czf "$tmp_tar" -C "$local_dir" .
    
    # 上传
    scp $ssh_opts "$tmp_tar" "$REMOTE_USER@$REMOTE_HOST:/tmp/"
    
    # 解压到目标目录
    ssh $ssh_opts "$REMOTE_USER@$REMOTE_HOST" "
        mkdir -p $remote_dir
        rm -rf $remote_dir/*
        tar -xzf /tmp/$(basename $tmp_tar) -C $remote_dir
        rm -f /tmp/$(basename $tmp_tar)
        chmod -R 755 $remote_dir
    "
    
    rm -f "$tmp_tar"
    log_info "$name 上传完成"
}

# 部署到服务器
deploy_to_server() {
    log_step "部署到服务器..."
    
    local ssh_opts="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    
    # 备份现有部署
    log_info "备份现有部署..."
    ssh $ssh_opts $REMOTE_USER@$REMOTE_HOST "
        TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
        if [ -d \"$REMOTE_PATH/admin\" ]; then
            mv $REMOTE_PATH/admin $REMOTE_PATH/admin.backup.\$TIMESTAMP 2>/dev/null || true
        fi
        if [ -d \"$REMOTE_PATH/web\" ]; then
            mv $REMOTE_PATH/web $REMOTE_PATH/web.backup.\$TIMESTAMP 2>/dev/null || true
        fi
        echo \"备份完成\"
    " 2>/dev/null || log_warn "备份步骤出现问题，继续部署..."
    
    # 部署 admin
    deploy_dir "apps/admin/dist" "$REMOTE_PATH/admin" "Admin"
    
    # 部署 web
    deploy_dir "apps/web/dist" "$REMOTE_PATH/web" "Web"
    
    log_info "部署完成"
}

# 部署落地页 (www.html)
deploy_landing() {
    log_step "部署落地页..."
    
    local ssh_opts="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    
    # 确保 index 目录存在
    ssh $ssh_opts $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH/index"
    
    # 上传 www.html 到 index 目录
    scp $ssh_opts www.html $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/index/index.html
    
    ssh $ssh_opts $REMOTE_USER@$REMOTE_HOST "
        chmod 644 $REMOTE_PATH/index/index.html
    "
    
    log_info "落地页部署完成"
}

# 验证部署
verify_deployment() {
    log_step "验证部署..."
    
    local failed=0
    
    # 检查首页
    local home_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/")
    if [ "$home_status" = "200" ]; then
        log_info "✓ 首页 (/): 200 OK"
    else
        log_error "✗ 首页 (/): HTTP $home_status"
        failed=1
    fi
    
    # 检查 web
    local web_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/web/")
    if [ "$web_status" = "200" ]; then
        log_info "✓ Web 应用 (/web/): 200 OK"
    else
        log_error "✗ Web 应用 (/web/): HTTP $web_status"
        failed=1
    fi
    
    # 检查 admin
    local admin_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/admin/")
    if [ "$admin_status" = "200" ]; then
        # 检查返回的内容是否是 admin 应用
        local admin_content=$(curl -s "$DOMAIN/admin/" | head -20)
        if echo "$admin_content" | grep -qE "(root|admin|后台|创意喵后台)"; then
            log_info "✓ Admin 应用 (/admin/): 200 OK (内容验证通过)"
        else
            log_warn "⚠ Admin 应用 (/admin/): 200 OK 但内容可疑"
            log_warn "响应内容: $(echo "$admin_content" | head -3)"
        fi
    else
        log_error "✗ Admin 应用 (/admin/): HTTP $admin_status"
        failed=1
    fi
    
    # 检查 API
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/health")
    if [ "$api_status" = "200" ]; then
        log_info "✓ API (/api/health): 200 OK"
    else
        log_warn "⚠ API (/api/health): HTTP $api_status"
    fi
    
    if [ $failed -eq 0 ]; then
        log_info "所有验证通过!"
        return 0
    else
        log_error "部分验证失败，请检查日志"
        return 1
    fi
}

# 清理旧备份
cleanup_backups() {
    log_step "清理旧备份..."
    
    local ssh_opts="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"
    
    ssh $ssh_opts $REMOTE_USER@$REMOTE_HOST "
        echo '备份清理前:'
        ls -la $REMOTE_PATH/ | grep backup || echo '无备份文件'
        find $REMOTE_PATH -maxdepth 1 -name '*.backup.*' -type d -mtime +3 -exec rm -rf {} + 2>/dev/null || true
        echo '备份清理后:'
        ls -la $REMOTE_PATH/ | grep backup || echo '无备份文件'
    "
}

# 使用说明
usage() {
    cat << EOF
╔══════════════════════════════════════════════════════════╗
║          创意喵平台部署脚本                                ║
╚══════════════════════════════════════════════════════════╝

用法: $0 [命令] [选项]

命令:
    all           执行完整部署流程 (构建+修复+部署+验证)
    build         仅构建项目
    deploy        仅部署 (不上传落地页)
    landing       仅部署落地页
    verify        仅验证部署状态
    clean         清理服务器旧备份

选项:
    --skip-build     跳过构建步骤
    --skip-verify    跳过验证步骤
    --help, -h       显示帮助

示例:
    $0 all                    # 完整部署
    $0 deploy --skip-build    # 仅部署，不重新构建
    $0 verify                 # 仅验证

环境变量:
    SSH_KEY        SSH 密钥路径 (默认: ./ssh/139.224.105.241_20260404233402_id_rsa)
EOF
}

# 主函数
main() {
    local cmd="${1:-all}"
    local skip_build=false
    local skip_verify=false
    
    # 解析选项
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
            deploy_to_server
            deploy_landing
            if [ "$skip_verify" = false ]; then
                verify_deployment
            fi
            cleanup_backups
            log_info "🎉 部署流程全部完成!"
            echo ""
            echo "访问地址:"
            echo "  首页:    $DOMAIN/"
            echo "  Web:     $DOMAIN/web/"
            echo "  Admin:   $DOMAIN/admin/"
            ;;
        build)
            check_deps
            build_project
            fix_paths
            log_info "构建完成，输出在 apps/admin/dist 和 apps/web/dist"
            ;;
        deploy)
            check_deps
            deploy_to_server
            ;;
        landing)
            check_deps
            deploy_landing
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
