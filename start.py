#!/usr/bin/env python3
"""
Production startup script for Physics Mini App API
"""
import os
import uvicorn
from api_server_postgres import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "api_server_postgres:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        workers=1
    )
