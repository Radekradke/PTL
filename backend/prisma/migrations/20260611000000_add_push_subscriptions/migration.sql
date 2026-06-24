CREATE TABLE "PushSubscription" (
  "id"        SERIAL PRIMARY KEY,
  "sector"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL UNIQUE,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
