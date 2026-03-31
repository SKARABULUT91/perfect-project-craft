import asyncio
import random
import time
from playwright.async_api import async_playwright
import requests
import os
from typing import List
import logging

# Konfigürasyon
TWITTER_2CAPTCHA_KEY = os.getenv("2CAPTCHA_KEY", "YOUR_2CAPTCHA_API_KEY")
TOR_PROXY = "socks5://127.0.0.1:9050"
ACCOUNTS = [  # Multiple accounts rotation
    {"username": "acc1", "password": "pass1", "email": "acc1@gmail.com"},
    {"username": "acc2", "password": "pass2", "email": "acc2@gmail.com"}
]
TARGET_KEYWORDS = ["crypto", "airdrop", "nft"]  # Blue tick hunter targets
FOLLOW_LIMIT = 50  # Hourly
LIKE_LIMIT = 100

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TwitterBot:
    def __init__(self):
        self.current_account_idx = 0
        self.stats = {"likes": 0, "retweets": 0, "follows": 0, "unfollows": 0}
    
    async def launch_browser(self):
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(
            proxy={"server": TOR_PROXY},
            headless=False,  # Debug için True yap
            args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1366, 'height': 768}
        )
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        """)
        return playwright, browser, context
    
    async def solve_captcha(self, page, sitekey: str):
        """2Captcha ile hCaptcha/iFrame CAPTCHA çöz"""
        url = page.url
        logger.info("CAPTCHA tespit edildi, 2Captcha ile çözülüyor...")
        
        # Sitekey extract
        captcha_data = await page.evaluate("""
            () => {
                const iframe = document.querySelector('iframe[src*="hcaptcha"]');
                return iframe ? iframe.src : null;
            }
        """)
        
        if not captcha_data:
            return False
        
        # 2Captcha submit
        submit_url = "http://2captcha.com/in.php"
        params = {
            'key': TWITTER_2CAPTCHA_KEY,
            'method': 'hcaptcha',
            'sitekey': sitekey,
            'pageurl': url,
            'json': 1
        }
        resp = requests.get(submit_url, params=params).json()
        
        if resp['status'] != 1:
            logger.error(f"CAPTCHA submit error: {resp}")
            return False
        
        captcha_id = resp['request']
        for _ in range(30):  # 5dk wait
            time.sleep(10)
            result = requests.get(f"http://2captcha.com/res.php?key={TWITTER_2CAPTCHA_KEY}&action=get&id={captcha_id}&json=1").json()
            if result['status'] == 1:
                token = result['request']
                await page.evaluate(f"""
                    () => {{
                        const hcaptcha = document.querySelector('[name="h-captcha-response"]');
                        if (hcaptcha) hcaptcha.value = '{token}';
                    }}
                """)
                logger.info("CAPTCHA çözüldü!")
                return True
        return False
    
    async def login(self, context, account: dict):
        """Multi-account login + CAPTCHA handling"""
        page = await context.new_page()
        await page.goto("https://twitter.com/i/flow/login")
        
        # Username
        await page.fill('input[autocomplete="username"]', account["username"])
        await page.click('div[role="button"]:has-text("Next")')
        await asyncio.sleep(random.uniform(2, 4))
        
        # Password
        await page.fill('input[data-testid="ocf_password"]', account["password"])
        await page.click('div[data-testid="LoginForm_Login_Button"]')
        await asyncio.sleep(5)
        
        # CAPTCHA check & solve
        captcha_detected = await page.query_selector('iframe[src*="hcaptcha"]')
        if captcha_detected:
            sitekey = await page.get_attribute('iframe[src*="hcaptcha"]', 'data-hcaptcha-widget-id') or "twitter-sitekey"
            await self.solve_captcha(page, sitekey)
        
        # Phone/Email verification bypass (skip if possible)
        try:
            await page.wait_for_selector('[data-testid="ocf_SignupOrLogin_continueWithEmailOrPhone"]', timeout=10000)
            await page.click('[data-testid="ocf_SignupOrLogin_continueWithEmailOrPhone"]')
            await page.fill('input[autocomplete="email"]', account["email"])
            await page.click('div[data-testid="ocf_SignupOrLogin_continueWithEmailOrPhone"]')
        except:
            pass
        
        await page.wait_for_url("https://twitter.com/home", timeout=30000)
        logger.info(f"✅ {account['username']} login başarılı")
        return page
    
    async def blue_tick_hunter(self, page: Page, keyword: str, limit: int = 20):
        """Verified (blue tick) users ara + mass follow"""
        await page.goto(f"https://twitter.com/search?q={keyword}%20filter:verified&src=typed_query")
        await page.wait_for_selector('[data-testid="tweet"]')
        
        tweets = await page.query_selector_all('[data-testid="tweet"]')
        verified_users = []
        
        for tweet in tweets[:limit]:
            try:
                # Blue tick check
                tick = await tweet.query_selector('[data-testid="icon-verified"]')
                if tick:
                    username = await tweet.query_selector('a[role="link"] time ~ div a[href*="/"]')
                    if username:
                        user_handle = await username.get_attribute('href')
                        verified_users.append(user_handle.split('/')[-1])
            except:
                continue
        
        logger.info(f"🔍 {len(verified_users)} blue tick user bulundu: {verified_users[:5]}")
        return verified_users
    
    async def mass_actions(self, page: Page, users: List[str], action_type: str = "follow"):
        """Mass follow/like/retweet/DM"""
        for i, user in enumerate(users):
            try:
                await page.goto(f"https://twitter.com/{user}")
                await asyncio.sleep(random.uniform(3, 6))
                
                if action_type == "follow":
                    follow_btn = page.locator('[data-testid="placementTracking"] span:has-text("Follow")')
                    if await follow_btn.count():
                        await follow_btn.click()
                        self.stats["follows"] += 1
                        logger.info(f"👤 {user} takip edildi ({self.stats['follows']}/{FOLLOW_LIMIT})")
                
                elif action_type == "like":
                    tweet = page.locator(f'[data-testid="tweet"]')
                    await tweet.first.click()
                    await page.click('[data-testid="like"]')
                    self.stats["likes"] += 1
                
                elif action_type == "retweet":
                    await page.click('[data-testid="retweet"]')
                    await page.click('[data-testid="retweetConfirm"]')
                    self.stats["retweets"] += 1
                
                elif action_type == "dm":
                    await page.click('[data-testid="DMButton"]')
                    await page.fill('[data-testid="dmComposerTextInput"]', "Merhaba! İçeriğinizi beğendim 🚀")
                    await page.click('[data-testid="sendButton"]')
                
                # Rate limit respect
                if self.stats["follows"] >= FOLLOW_LIMIT:
                    logger.warning("⏱️ Hourly limit ulaşıldı, 1 saat bekleniyor...")
                    await asyncio.sleep(3600)
                
                await asyncio.sleep(random.uniform(5, 10))  # Human-like delay
                
            except Exception as e:
                logger.error(f"❌ {user} işlem hatası: {e}")
                continue
    
    async def mass_unfollow(self, page: Page, limit: int = 50):
        """Takip ettiklerini toplu bırak"""
        await page.goto("https://twitter.com/i/user/following")
        follows = await page.query_selector_all('[data-testid="UserCell"] a[href*="/"]')
        
        for i in range(min(limit, len(follows))):
            try:
                await page.click(f'[data-testid="UserCell"] a[href*="/"] >> nth={i}')
                unfollow_btn = page.locator('[data-testid="userUnfollowConfirm"]')
                if await unfollow_btn.count():
                    await unfollow_btn.click()
                    self.stats["unfollows"] += 1
                    logger.info(f"👋 {i+1}. unfollow")
                await asyncio.sleep(2)
            except:
                continue
    
    async run_campaign(self):
        """Ana otomasyon döngüsü"""
        playwright, browser, context = await self.launch_browser()
        
        while True:  # Infinite campaign
            account = ACCOUNTS[self.current_account_idx % len(ACCOUNTS)]
            page = await self.login(context, account)
            
            # Blue tick hunt + mass follow
            for keyword in TARGET_KEYWORDS:
                users = await self.blue_tick_hunter(page, keyword)
                await self.mass_actions(page, users[:10], "follow")
            
            # Mass like/retweet
            await self.mass_actions(page, ["crypto", "web3", "bitcoin"][:5], "like")
            
            # Cleanup
            await self.mass_unfollow(page)
            
            self.current_account_idx += 1
            await page.close()
            await asyncio.sleep(300)  # 5dk account rotation

# Run
async def main():
    bot = TwitterBot()
    await bot.run_campaign()

if __name__ == "__main__":
    asyncio.run(main())
