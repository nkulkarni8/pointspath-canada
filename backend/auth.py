"""Minimal Supabase JWT verification — scoped only to the /wallet endpoints.

The frontend already authenticates against Supabase directly; this module
never issues tokens, it only verifies the signature on a token Supabase
already handed the browser, using the project's JWT secret, to recover the
Supabase user id (the JWT `sub` claim) for per-user wallet storage.
"""
from fastapi import Header, HTTPException
from jose import jwt, JWTError
from config import settings


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Auth not configured on server")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    return user_id
