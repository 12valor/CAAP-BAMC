# Permission boundary

Authorization helpers belong in this directory. Every server mutation must
verify the authenticated identity and required role before changing data.

Roles must come from server-controlled data or trusted app metadata. Never use
Supabase `user_metadata` for authorization decisions. Route groups and visible
navigation are organizational UI conventions, not security boundaries.
