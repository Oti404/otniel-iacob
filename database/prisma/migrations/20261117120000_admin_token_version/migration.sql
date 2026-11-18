-- Bumped on logout to revoke every outstanding refresh token.
ALTER TABLE "AdminUser" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
