"""Wait for MySQL to accept connections before starting the app."""
import os
import sys
import time

def main():
    try:
        import pymysql
    except ImportError:
        print("pymysql not installed, skipping wait")
        return 0

    if "mysql" not in os.environ.get("DATABASE_URL", ""):
        return 0

    host = os.environ.get("MYSQL_HOST", "mysql")
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    user = os.environ.get("MYSQL_USER", "app")
    password = os.environ.get("MYSQL_PASSWORD", "apppass")
    database = os.environ.get("MYSQL_DATABASE", "ecommerce")

    for i in range(30):
        try:
            conn = pymysql.connect(host=host, port=port, user=user, password=password, database=database, connect_timeout=3)
            conn.close()
            print("MySQL is ready.")
            return 0
        except Exception as e:
            print(f"Waiting for MySQL... ({i+1}/30) {e}")
            time.sleep(2)

    print("MySQL did not become ready in time.")
    return 1

if __name__ == "__main__":
    sys.exit(main())
