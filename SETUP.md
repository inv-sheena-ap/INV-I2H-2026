# Setup & Run Guide (Docker + MySQL)

This document describes how to run the e-commerce project with **Docker** and **MySQL**, how to access MySQL to inspect tables, how seed data is loaded, and how product images work.

---

## 1. Run the full stack with Docker

**Prerequisites:** Docker and [Docker Compose](https://docs.docker.com/compose/install/) installed.

From the **project root** (where `docker-compose.yml` is):

```bash
docker compose up --build
```

- **First run** can take a few minutes (building images, MySQL starting, backend waiting for MySQL then running seed).
- **Backend** waits for MySQL to accept connections (`wait_for_mysql.py`), then runs `seed_data.py`: creates tables, adds 20 products (with `image_path` set to `product_1.jpg` … `product_20.jpg`), and creates a default user `admin@shop.com` / `admin123`. Place image files in `backend/uploads/` (see **docs/IMAGES_NEEDED.md** for prompts to generate them with Gemini).
- **Frontend:** http://localhost:5173  
- **API docs:** http://localhost:8000/docs  
- **MySQL:** port **3307** on host (mapped from container 3306 to avoid conflict with local MySQL). See below for login.

**Run in background:**

```bash
docker compose up -d --build
```

**Stop:**

```bash
docker compose down
```

**View logs:**

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

---

## 2. Seed data (add products and default user to DB)

Seed runs **automatically** when the backend container starts (see backend `Dockerfile` CMD).

To **run seed manually** (e.g. to reset or re-seed):

```bash
docker compose exec backend python seed_data.py
```

- If the DB already has products, seed skips (idempotent).
- To start fresh: remove the MySQL volume and bring stack up again:
  ```bash
  docker compose down -v
  docker compose up -d
  ```
  Then run seed again if needed: `docker compose exec backend python seed_data.py`.

**Default user after seed:** `admin@shop.com` / `admin123`.

---

## 3. MySQL: enter shell and inspect tables

### 3.1 Enter the MySQL container shell (bash)

```bash
docker compose exec mysql bash
```

You are now inside the MySQL container. Exit with `exit`.

### 3.2 Open MySQL client and list databases

From inside the MySQL container:

```bash
mysql -u app -papppass -e "SHOW DATABASES;"
```

Or open an interactive MySQL session:

```bash
mysql -u app -papppass ecommerce
```

Then in the `mysql>` prompt:

```sql
SHOW TABLES;
```

### 3.3 Inspect each table

**List tables:**

```sql
USE ecommerce;
SHOW TABLES;
```

Typical tables: `users`, `user_addresses`, `products`, `orders`, `order_items`.

**Describe and query:**

```sql
DESCRIBE users;
SELECT id, email, username, full_name, role FROM users;

DESCRIBE user_addresses;
SELECT * FROM user_addresses LIMIT 5;

DESCRIBE products;
SELECT id, name, price, stock, category, image_path FROM products LIMIT 5;

DESCRIBE orders;
SELECT id, user_id, total, status, payment_method FROM orders LIMIT 5;

DESCRIBE order_items;
SELECT * FROM order_items LIMIT 10;
```

### 3.4 One-liner from host (without entering bash)

To run a single command from the host:

```bash
docker compose exec mysql mysql -u app -papppass ecommerce -e "SHOW TABLES;"
```

**Root user** (for MySQL admin tasks):

```bash
docker compose exec mysql mysql -u root -prootpass ecommerce -e "SHOW TABLES;"
```

---

## 4. Top bar: search only, search after Orders

- The **top bar** includes: E-Shop logo, Products, Cart, Addresses (when logged in), **Orders** (when logged in), then the **search bar** (search by product name or category), then user email and Logout (or Login / Sign up).
- **Search** is the only search box in the top bar and is placed **after** the Orders option.

---

## 5. Product images

- **Backend** serves product images from `/uploads/` (files in `backend/uploads/`).
- **Seed** sets each product's `image_path` to `product_1.jpg` … `product_20.jpg`. Add image files to `backend/uploads/` (see **docs/IMAGES_NEEDED.md** for Gemini prompts).
- **Frontend** builds image URL as: `{API_BASE}/uploads/{image_path}` (e.g. `http://localhost:8000/uploads/product_1.jpg`).
- If an image is missing or fails to load, a **placeholder** (“No image”) is shown so the layout stays correct.

**If images don’t show:**

1. Ensure backend is up and seed has run: `docker compose logs backend` and look for “Seed completed”.
2. Add image files to `backend/uploads/` as `product_1.jpg` … `product_20.jpg` (see docs/IMAGES_NEEDED.md).
3. Check that files exist: `docker compose exec backend ls -la /app/uploads/`
4. Open the image URL in the browser: `http://localhost:8000/uploads/product_1.jpg`.

---

## 6. Summary of useful commands

| Task | Command |
|------|--------|
| Start stack | `docker compose up --build` |
| Start in background | `docker compose up -d --build` |
| Stop | `docker compose down` |
| Stop and remove DB volume | `docker compose down -v` |
| Run seed manually | `docker compose exec backend python seed_data.py` |
| Enter MySQL container shell | `docker compose exec mysql bash` |
| MySQL: show tables (from host) | `docker compose exec mysql mysql -u app -papppass ecommerce -e "SHOW TABLES;"` |
| MySQL: interactive session | `docker compose exec mysql mysql -u app -papppass ecommerce` |
| Backend logs | `docker compose logs -f backend` |
| List uploads (product images) | `docker compose exec backend ls -la /app/uploads/` |

---

## 7. Database URL (MySQL)

When running with Docker Compose, the backend uses:

- **URL:** `mysql+pymysql://app:apppass@mysql:3306/ecommerce`
- Set via env: `DATABASE_URL` in `docker-compose.yml` for the `backend` service.
- To run the backend **locally** against the same MySQL (Docker MySQL is on host port **3307**):
  ```bash
  export DATABASE_URL="mysql+pymysql://app:apppass@localhost:3307/ecommerce"
  cd backend && python -m uvicorn app.main:app --reload --port 8000
  ```
