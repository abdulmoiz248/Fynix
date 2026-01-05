import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from datetime import datetime, time, timezone
from dotenv import load_dotenv

load_dotenv()

supabaseUrl=os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabaseKey=os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase=create_client(supabaseUrl,supabaseKey)

def getTodayPsxPrice(symbol):
    url=f"https://dps.psx.com.pk/company/{symbol}"
    headers={"User-Agent":"Mozilla/5.0"}
    res=requests.get(url,headers=headers,timeout=10)
    soup=BeautifulSoup(res.text,"html.parser")
    priceTag=soup.select_one("div.quote__close")
    if not priceTag:
        return None
    return float(priceTag.text.replace(",","").replace("Rs.","").strip())

stocks=supabase.table("psx_stocks").select("id,symbol").execute().data

for stock in stocks:
    price=getTodayPsxPrice(stock["symbol"])
    if price is None:
        continue
    supabase.table("psx_stocks").update({
        "current_price":price,
        "last_updated":datetime.now(timezone.utc).isoformat()
    }).eq("id",stock["id"]).execute()
    print(stock["symbol"],price)
