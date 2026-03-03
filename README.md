# E-Shop – Full-Stack E-Commerce

A full-stack e-commerce application with **Python (FastAPI)** backend and **React (Vite + Material UI)** frontend. Uses **MySQL** for data and supports **Docker** or local runs.

---

## Features

- **Auth:** Sign up, login (JWT), unique email and username
- **Products:** List, search (name/category), product detail, product images
- **Cart:** Add/remove items, select delivery address, place order (cash on delivery)
- **Orders:** Order list with product names and images, order detail
- **Addresses:** CRUD saved addresses (label, line1, line2, city, state, pincode, phone)
- **UI:** Login/signup show only “E-Shop” in header; main app has nav, search, footer on all pages

---

## Tech Stack

| Layer   | Technology        |
|--------|--------------------|
| Backend | Python 3.11+, FastAPI |
| DB     | MySQL 8 (PyMySQL, SQLAlchemy 2) |
| Auth   | JWT (python-jose), bcrypt |
| Frontend | Node 20+, React 19, Vite 7, Material UI 7 |

---

## Project Structure

```
bug-project/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, routes, static uploads
│   │   ├── config.py         # Settings (DB URL, JWT, upload dir)
│   │   ├── database.py       # MySQL engine, session, get_db
│   │   ├── models.py         # User, Product, Order, OrderItem, UserAddress
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── auth.py           # JWT, get_current_user
│   │   └── routers/
│   │       ├── auth_router.py
│   │       ├── products_router.py
│   │       ├── orders_router.py
│   │       ├── addresses_router.py
│   │       └── delivery_router.py
│   ├── uploads/              # Product images (product_1.jpg … product_20.jpg)
│   ├── seed_data.py          # Seed 20 products + default user
│   ├── wait_for_mysql.py     # Used by Docker to wait for MySQL
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx, Footer.jsx
│   │   ├── pages/            # Login, Signup, ProductList, ProductView, Cart, Addresses, OrderList, OrderDetail
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docs/
│   └── IMAGES_NEEDED.md      # List of product images for Gemini AI
├── docker-compose.yml        # MySQL + backend + frontend
├── .gitignore
└── README.md
```

---

## How to Run

### Option 1: Docker (recommended)

**Prerequisites:** Docker and Docker Compose.

1. From project root:
   ```bash
   docker compose up --build
   ```
2. Backend waits for MySQL, runs `seed_data.py` (creates tables, 20 products, default user), then starts the API.
3. Open:
   - **App:** http://localhost:5173  
   - **API docs:** http://localhost:8000/docs  
4. Log in: **admin@shop.com** / **admin123**

**Useful commands:**

| Command | Description |
|--------|-------------|
| `docker compose up -d --build` | Run in background |
| `docker compose down` | Stop containers |
| `docker compose down -v` | Stop and remove volumes (fresh DB next run) |
| `docker compose exec backend python seed_data.py` | Re-run seed (skips if data exists) |
| `docker compose exec mysql bash` | Shell into MySQL container |

**MySQL (from host):** Port **3307** (mapped from container 3306). Use `mysql -h 127.0.0.1 -P 3307 -u app -papppass ecommerce` if MySQL client is installed.

---

### Option 2: Without Docker (local MySQL + backend + frontend)

**Prerequisites:** Python 3.11+, Node 20+, MySQL 8.

1. **MySQL:** Create database and user:
   ```sql
   CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'app'@'localhost' IDENTIFIED BY 'apppass';
   GRANT ALL ON ecommerce.* TO 'app'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Backend:** From project root:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   Set DB URL (default is `localhost:3307`; if MySQL is on 3306, override):
   ```bash
   set DATABASE_URL=mysql+pymysql://app:apppass@localhost:3306/ecommerce
   python seed_data.py
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend:** In another terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Optional: `frontend/.env` with `VITE_API_URL=http://localhost:8000`.

4. Open http://localhost:5173 and log in with **admin@shop.com** / **admin123**.

---

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | MySQL URL, e.g. `mysql+pymysql://app:apppass@localhost:3306/ecommerce` |
| `VITE_API_URL` | Frontend | API base URL, e.g. `http://localhost:8000` (Docker: same for browser) |
| `MYSQL_HOST`, `MYSQL_PORT`, etc. | Backend (Docker) | For `wait_for_mysql.py` |

---

## Product Images

The app expects images in **`backend/uploads/`** named **`product_1.jpg`** … **`product_20.jpg`** (one per seeded product).

- **List of images and prompts:** See **[docs/IMAGES_NEEDED.md](docs/IMAGES_NEEDED.md)** for a table of product names and short descriptions you can use with Gemini (or any image AI) to generate the files. Save the outputs with the given filenames in `backend/uploads/`.

If a product has no image file, the UI shows a placeholder.

---

## Default credentials (after seed)

- **Email:** admin@shop.com  
- **Password:** admin123  

(Seed creates one default user with these credentials; there is no admin role—all users have the same permissions.)  

---

## API Overview

- **Auth:** `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- **Products:** `GET /products` (optional `?search=`), `GET /products/{id}`, `GET /products/categories`
- **Orders:** `POST /orders`, `GET /orders`, `GET /orders/{id}`
- **Addresses:** `GET/POST /addresses`, `GET/PUT/DELETE /addresses/{id}`
- **Delivery:** `POST /delivery/check` (pincode validation)

All except signup/login and API root require `Authorization: Bearer <token>`.

---

## License

For educational use. Do not use in production as-is.
