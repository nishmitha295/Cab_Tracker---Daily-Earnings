
/*
# Cab Expense Tracker — Initial Schema

## Summary
Creates the two tables needed for the cab expense tracker MVP:
- `cab_users`: stores driver profiles with a 4-digit PIN for authentication.
- `daily_entries`: stores one row per driver per calendar day, recording income
  and the six expense categories (diesel, food, parking, repair, service, other).
  Total expense and profit are derived at query time (income - sum of expense columns).

## Tables

### cab_users
| Column    | Type    | Notes                         |
|-----------|---------|-------------------------------|
| id        | uuid    | PK, auto-generated            |
| name      | text    | Driver's display name         |
| phone     | text    | Optional phone number         |
| pin       | text    | 4-digit PIN (stored as text)  |
| created_at| timestamptz | Row creation timestamp    |

### daily_entries
| Column    | Type        | Notes                                  |
|-----------|-------------|----------------------------------------|
| id        | uuid        | PK, auto-generated                     |
| user_id   | uuid        | FK → cab_users.id, ON DELETE CASCADE   |
| date      | date        | Calendar date (one row per user/date)  |
| income    | numeric     | Total earnings for the day             |
| diesel    | numeric     | Diesel expense                         |
| food      | numeric     | Food expense                           |
| parking   | numeric     | Parking expense                        |
| repair    | numeric     | Repair expense                         |
| service   | numeric     | Car service expense                    |
| other     | numeric     | Miscellaneous expense                  |
| notes     | text        | Optional free-text notes               |
| created_at| timestamptz | Row creation timestamp                 |
| updated_at| timestamptz | Last update timestamp                  |

## Security
- RLS enabled on both tables.
- No Supabase Auth — authentication is handled by PIN lookup in the app.
- `anon` role gets full CRUD access because the frontend uses the anon key with
  no sign-in session. The app enforces user isolation via the user_id foreign key
  at the application layer.

## Notes
- A UNIQUE constraint on (user_id, date) ensures at most one daily entry per user per day.
  The app uses upsert semantics to update an existing entry for the same day.
*/

-- ─── cab_users ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cab_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text NOT NULL DEFAULT '',
  pin        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cab_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cab_users" ON cab_users;
CREATE POLICY "anon_select_cab_users" ON cab_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cab_users" ON cab_users;
CREATE POLICY "anon_insert_cab_users" ON cab_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cab_users" ON cab_users;
CREATE POLICY "anon_update_cab_users" ON cab_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cab_users" ON cab_users;
CREATE POLICY "anon_delete_cab_users" ON cab_users FOR DELETE
  TO anon, authenticated USING (true);

-- ─── daily_entries ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES cab_users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  income     numeric NOT NULL DEFAULT 0,
  diesel     numeric NOT NULL DEFAULT 0,
  food       numeric NOT NULL DEFAULT 0,
  parking    numeric NOT NULL DEFAULT 0,
  repair     numeric NOT NULL DEFAULT 0,
  service    numeric NOT NULL DEFAULT 0,
  other      numeric NOT NULL DEFAULT 0,
  notes      text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_daily_entries" ON daily_entries;
CREATE POLICY "anon_select_daily_entries" ON daily_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_entries" ON daily_entries;
CREATE POLICY "anon_insert_daily_entries" ON daily_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_entries" ON daily_entries;
CREATE POLICY "anon_update_daily_entries" ON daily_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_entries" ON daily_entries;
CREATE POLICY "anon_delete_daily_entries" ON daily_entries FOR DELETE
  TO anon, authenticated USING (true);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON daily_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
