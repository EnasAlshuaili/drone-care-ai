FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Runs pending Alembic migrations, then starts the API — see entrypoint.sh.
ENTRYPOINT ["./entrypoint.sh"]
