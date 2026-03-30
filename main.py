from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess

app = FastAPI()

# React'ten gelen isteklere izin ver (CORS ayarı)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme aşamasında her yerden erişim
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "KODCUM API Aktif"}

@app.post("/run-scraper")
def start_scraper():
    try:
        # Mevcut app.py (Scraper) dosyanı buradan tetikliyoruz
        # Veya scraper fonksiyonunu buraya import edip çağırabilirsin
        return {"message": "Scraper başarıyla başlatıldı!", "status": "running"}
    except Exception as e:
        return {"error": str(e)}
