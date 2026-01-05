import os
import re
import base64
from datetime import datetime, timedelta, timezone
from supabase import create_client
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

supabaseUrl=os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabaseKey=os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase=create_client(supabaseUrl,supabaseKey)

senders=[
    "service@nayapay.com",
    "no-reply@meezanbank.com"
]

def extractBody(payload):
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType")=="text/html" and part.get("body",{}).get("data"):
                return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8","ignore")
    if payload.get("body",{}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8","ignore")
    return ""

def parseTransaction(body,subject):
    amountMatch=re.search(r'PKR\s*([\d,]+\.?\d*)',body)
    dateMatch=re.search(r'Transaction Date\s*:\s*([0-9A-Za-z-]+)',body)
    descMatch=re.search(r'Beneficiary.*?:\s*(.+?)<',body)

    if not amountMatch:
        return None

    amount=float(amountMatch.group(1).replace(",",""))
    isIncome="received" in body.lower() or "credit" in subject.lower()

    return {
        "type":"income" if isIncome else "expense",
        "amount":amount,
        "category":"bank",
        "description":descMatch.group(1).strip() if descMatch else subject,
        "date":datetime.strptime(dateMatch.group(1),"%d-%b-%Y").date() if dateMatch else datetime.utcnow().date()
    }

users=supabase.table("users").select("*").not_.is_("access_token","null").not_.is_("refresh_token","null").execute().data

for user in users:
    creds=Credentials(
        token=user["access_token"],
        refresh_token=user["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        scopes=[
            "https://mail.google.com/"
        ]
    )

    service=build("gmail","v1",credentials=creds)

    afterTs=int((datetime.now(timezone.utc)-timedelta(hours=24)).timestamp())
    query=f"after:{afterTs} ("+" OR ".join([f"from:{s}" for s in senders])+")"

    messages=service.users().messages().list(userId="me",q=query).execute().get("messages",[])

    for msg in messages:
        msgData=service.users().messages().get(userId="me",id=msg["id"],format="full").execute()
        headers={h["name"]:h["value"] for h in msgData["payload"]["headers"]}
        body=extractBody(msgData["payload"])

        tx=parseTransaction(body,headers.get("Subject",""))
        if not tx:
            continue

        supabase.table("transactions").insert({
            "user_id":user["id"],
            "type":tx["type"],
            "amount":tx["amount"],
            "category":tx["category"],
            "description":tx["description"],
            "date":tx["date"].isoformat()
        }).execute()

        service.users().messages().delete(userId="me",id=msg["id"]).execute()

        print({
            "user":user["email"],
            **tx,
            "deleted":True
        })
