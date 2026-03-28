from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright
import os, asyncio
from twocaptcha import TwoCaptcha

app = FastAPI(title="Twitter Pentest Tool")

class PentestRequest(BaseModel):
    targets: list[str]
    action: str  # "follow", "like", "retweet", "dm"

@app.post("/pentest")
async def twitter_pentest(req: PentestRequest):
    solver = TwoCaptcha(os.getenv('TWOCAPTCHA_API_KEY'))
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            proxy={"server": "socks5://127.0.0.1:9050"},
            args=['--no-sandbox']
        )
        
        context = await browser.new_context()
        page = await context.new_page()
        
        results = []
        for target in req.targets[:10]:  # Render limit
            try:
                # Twitter login + action
                await page.goto(f"https://twitter.com/{target}")
                
                # CAPTCHA varsa çöz
                if "captcha" in page.url:
                    captcha_result = solver.recaptcha(sitekey="...", url=page.url)
                    await page.evaluate(f"document.getElementById('g-recaptcha-response').innerHTML='{captcha_result['code']}'")
                
                # Action yap (follow/like vs)
                if req.action == "follow":
                    await page.click("text=Follow")
                
                results.append({"target": target, "success": True})
            except:
                results.append({"target": target, "success": False})
        
        await browser.close()
    
    return {"total": len(results), "success_count": sum(1 for r in results if r["success"])}

@app.get("/")
async def root():
    return {"message": "Twitter Pentest Tool Aktif 🚀"}
