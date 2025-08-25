"""
Main FastAPI application for Trading Post with AI Matching
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Import the AI matching router and AI pricing router
from ai_matching import get_router
from ai_pricing import get_ai_pricing_router

# Create FastAPI app
app = FastAPI(
    title="Trading Post AI",
    description=("Local community trading and bartering app with AI-powered matching"),
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the AI matching router
app.include_router(get_router())

# Include the AI pricing router
app.include_router(get_ai_pricing_router())


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Trading Post AI",
        "endpoints": {
            "match_group": "/api/match_group", 
            "analyze_photo": "/api/items/analyze-photo",
            "ai_suggestions": "/api/items/ai-suggestions/{session_id}",
            "docs": "/docs"
        },
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
