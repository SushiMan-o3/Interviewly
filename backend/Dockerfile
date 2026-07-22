FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2 (needs libpq at runtime)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first so this layer is cached unless requirements change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Bind 0.0.0.0 (not 127.0.0.1) so the port is reachable from outside the container
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]
