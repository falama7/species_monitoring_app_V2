FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/images uploads/audio uploads/exports uploads/reports

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port
EXPOSE 5000

# Set entrypoint
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "300", "wsgi:app"]