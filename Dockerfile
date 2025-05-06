FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads
RUN chmod +x start_tsr_demo.sh

EXPOSE 8000

CMD ["./start_tsr_demo.sh"]
