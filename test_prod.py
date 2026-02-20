import requests

url = "http://maestro.uz/api/auth/register/"
data = {
    "username": "test3",
    "email": "test3@gmail.com",
    "first_name": "Test",
    "last_name": "Test",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "role": "CLIENT"
}

try:
    print("Testing HTTP POST...")
    resp = requests.post(url, json=data, timeout=10)
    print("Status:", resp.status_code)
    print("Headers:", resp.headers)
    print("Body:", resp.text[:500])
except Exception as e:
    print("HTTP POST failed:", e)

url_https = "https://maestro.uz/api/auth/register/"
try:
    print("\nTesting HTTPS POST...")
    resp = requests.post(url_https, json=data, timeout=10)
    print("Status:", resp.status_code)
    print("Headers:", resp.headers)
    print("Body:", resp.text[:500])
except Exception as e:
    print("HTTPS POST failed:", e)
