FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads
RUN chmod +x run_server.sh

EXPOSE 8000

CMD ["./run_server.sh"]
