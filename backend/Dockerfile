# E-commerce backend - Python 3.12
FROM python:3.11-slim

WORKDIR /app

# Upgrade pip first; use longer timeout and retries for slow/unreliable networks
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    --timeout 120 --retries 5

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --timeout 120 --retries 5

COPY . .

EXPOSE 8000

# Wait for MySQL, then seed DB (idempotent), then start API
CMD python wait_for_mysql.py && python seed_data.py 2>/dev/null || true && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
