\echo '=== [00] Bootstrapping user and database ==='

-- Crée le rôle dratharias si absent
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dratharias') THEN
    CREATE ROLE dratharias WITH LOGIN PASSWORD 'test123';
  END IF;
END;
$$;

-- Crée la base dev-kitchen si absente
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dev-kitchen') THEN
    CREATE DATABASE "dev-kitchen" OWNER dratharias;
  END IF;
END;
$$;

\echo '=== User and database bootstrap complete ==='
