import { randomInt, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "BOOTSTRAP_ADMIN_USERNAME",
  "BOOTSTRAP_ADMIN_DISPLAY_NAME",
];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} is required for the one-time admin bootstrap.`);
  }
}

if (!process.env.SUPABASE_SECRET_KEY.startsWith("sb_secret_")) {
  throw new Error("SUPABASE_SECRET_KEY must be a current Supabase secret key.");
}

const username = process.env.BOOTSTRAP_ADMIN_USERNAME.trim().toLowerCase();
if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
  throw new Error("BOOTSTRAP_ADMIN_USERNAME has an invalid format.");
}

const sets = [
  "abcdefghijkmnopqrstuvwxyz",
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "23456789",
  "!@#$%*-_+",
];
const all = sets.join("");
const passwordCharacters = sets.map(
  (characters) => characters[randomInt(characters.length)],
);
while (passwordCharacters.length < 18) {
  passwordCharacters.push(all[randomInt(all.length)]);
}
for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
  const swap = randomInt(index + 1);
  [passwordCharacters[index], passwordCharacters[swap]] = [
    passwordCharacters[swap],
    passwordCharacters[index],
  ];
}
const generatedPassword = passwordCharacters.join("");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { count, error: countError } = await admin
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "admin")
  .is("deleted_at", null);
if (countError) throw countError;
if ((count ?? 0) > 0) {
  throw new Error("Bootstrap refused: an administrator already exists.");
}

const authUserId = randomUUID();
const internalIdentifier = `${authUserId}@accounts.caap-bamc.invalid`;
const { error: authError } = await admin.auth.admin.createUser({
  id: authUserId,
  email: internalIdentifier,
  password: generatedPassword,
  email_confirm: true,
});
if (authError) throw authError;

const { error: profileError } = await admin.rpc("bootstrap_first_admin", {
  actor_auth_user_id: authUserId,
  account_username: username,
  auth_identifier: internalIdentifier,
  account_display_name: process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME.trim(),
});
if (profileError) {
  await admin.auth.admin.deleteUser(authUserId, false);
  throw profileError;
}

console.log("Initial administrator created successfully.");
console.log(`Username: ${username}`);
console.log(`One-time generated password: ${generatedPassword}`);
console.log("Copy the password now. It cannot be retrieved later.");
