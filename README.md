# 我的图书借阅系统 (My Book App)

这是一个基于 Node.js + Express + PostgreSQL + Docker 开发的现代化图书借阅系统。

## 核心功能
- 图书的增删改查
- 借阅人管理、借出/归还时间记录、逾期提醒
- 分页、分类筛选、关键字搜索
- 数据看板实时统计

## 技术栈
- 前端：原生 HTML + Tailwind CSS
- 后端：Node.js + Express
- 数据库：PostgreSQL 15
- 部署：Docker + Docker Compose

## 如何运行
1. 克隆本项目：`git clone https://github.com/Francine-cry/my-book-app.git`
2. 进入目录：`cd my-book-app`
3. 启动容器：`docker compose up -d --build`
4. 浏览器访问：`http://localhost:8081`
