#!/usr/bin/env python3
import base64, hashlib, hmac, json, os, secrets, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8140"
env = {}
for line in Path("/opt/supabase-tee-time-social/.env").read_text().splitlines():
    if line and not line.lstrip().startswith("#") and "=" in line:
        key, value = line.split("=", 1)
        env[key] = value.strip().strip('"').strip("'")
ANON = env["ANON_KEY"]
SERVICE = env["SERVICE_ROLE_KEY"]
JWT_SECRET = env["JWT_SECRET"]

def request(method, path, apikey, bearer=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"apikey": apikey, "Content-Type": "application/json"}
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            parsed = json.loads(raw) if raw else None
        except Exception:
            parsed = None
        return error.code, parsed

def create_user(label):
    nonce = secrets.token_hex(8)
    password = secrets.token_urlsafe(24)
    status, payload = request("POST", "/auth/v1/admin/users", SERVICE, SERVICE, {
        "email": f"tts-auth-{label}-{nonce}@example.invalid",
        "password": password,
        "email_confirm": True
    })
    if status not in (200, 201) or not isinstance(payload, dict):
        raise RuntimeError(f"create user failed: {status}")
    user_id = payload["id"]
    status, login = request("POST", "/auth/v1/token?grant_type=password", ANON, body={
        "email": payload["email"],
        "password": password
    })
    if status != 200 or not isinstance(login, dict):
        raise RuntimeError(f"sign in failed: {status}")
    return str(user_id), str(login["access_token"])

def b64(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()

def expired_token(subject):
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = b64(json.dumps({
        "aud": "authenticated", "role": "authenticated", "sub": subject,
        "iat": int(time.time()) - 3600, "exp": int(time.time()) - 60
    }, separators=(",", ":")).encode())
    signature = b64(hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"

users = []
results = {}
try:
    status, rows = request("GET", "/rest/v1/leads?select=id&limit=1", ANON)
    booking_status, _ = request("GET", "/rest/v1/simulator_bookings?select=booking_time&limit=1", ANON)
    rpc_status, occupied = request(
        "POST", "/rest/v1/rpc/get_simulator_occupied_slots", ANON,
        body={"p_booking_date": "1900-01-01", "p_simulator": "security-test"}
    )
    narrow_rows = isinstance(occupied, list) and all(
        isinstance(row, dict) and set(row) <= {"booking_time", "booking_end_time", "duration"}
        for row in occupied
    )
    results["unauthenticated"] = {
        "status": status,
        "visible_rows": len(rows) if status == 200 and isinstance(rows, list) else 0,
        "direct_booking_status": booking_status,
        "availability_rpc_status": rpc_status,
        "availability_rows_narrow": narrow_rows
    }

    nonadmin_id, nonadmin_token = create_user("nonadmin")
    users.append(nonadmin_id)
    status, value = request("POST", "/rest/v1/rpc/is_tts_admin", ANON, nonadmin_token, {})
    read_status, rows = request("GET", "/rest/v1/leads?select=id&limit=1", ANON, nonadmin_token)
    promote_status, _ = request(
        "POST", "/rest/v1/tts_admin_users", ANON, nonadmin_token,
        {"user_id": nonadmin_id}
    )
    results["non_admin"] = {
        "rpc_status": status,
        "is_admin": value,
        "read_status": read_status,
        "visible_rows": len(rows or []),
        "self_promotion_status": promote_status
    }

    admin_id, admin_token = create_user("admin")
    users.append(admin_id)
    status, _ = request("POST", "/rest/v1/tts_admin_users", SERVICE, SERVICE, {"user_id": admin_id})
    if status not in (200, 201):
        raise RuntimeError(f"admin grant failed: {status}")
    status, value = request("POST", "/rest/v1/rpc/is_tts_admin", ANON, admin_token, {})
    read_status, rows = request("GET", "/rest/v1/leads?select=id&limit=1", ANON, admin_token)
    results["admin"] = {"rpc_status": status, "is_admin": value, "read_status": read_status, "visible_rows": len(rows or [])}

    status, _ = request("GET", "/rest/v1/leads?select=id&limit=1", ANON, expired_token(nonadmin_id))
    results["expired_session"] = {"status": status, "rejected": status == 401}
finally:
    cleanup = {"admin_mapping_removed": False, "users_removed": 0}
    if len(users) > 1:
        status, _ = request("DELETE", "/rest/v1/tts_admin_users?user_id=eq." + urllib.parse.quote(users[1]), SERVICE, SERVICE)
        cleanup["admin_mapping_removed"] = status in (200, 204)
    for user_id in users:
        status, _ = request("DELETE", "/auth/v1/admin/users/" + urllib.parse.quote(user_id), SERVICE, SERVICE)
        cleanup["users_removed"] += int(status in (200, 204))
    results["cleanup"] = cleanup

expected = (
    results.get("unauthenticated", {}).get("status") in (200, 401, 403)
    and results.get("unauthenticated", {}).get("visible_rows") == 0
    and results.get("unauthenticated", {}).get("direct_booking_status") in (401, 403)
    and results.get("unauthenticated", {}).get("availability_rpc_status") == 200
    and results.get("unauthenticated", {}).get("availability_rows_narrow") is True
    and results.get("non_admin", {}).get("is_admin") is False
    and results.get("non_admin", {}).get("visible_rows") == 0
    and results.get("non_admin", {}).get("self_promotion_status") in (401, 403)
    and results.get("admin", {}).get("is_admin") is True
    and results.get("admin", {}).get("visible_rows", 0) > 0
    and results.get("expired_session", {}).get("rejected") is True
    and results.get("cleanup", {}).get("admin_mapping_removed") is True
    and results.get("cleanup", {}).get("users_removed") == 2
)
print(json.dumps({"passed": expected, "results": results}, indent=2))
raise SystemExit(0 if expected else 1)
