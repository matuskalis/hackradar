-- Recurring events. An `annual` event that has ended gets one child row, the
-- next edition, inserted as `pending` so an admin confirms the guessed date.
alter table hackathons
  add column recurrence text not null default 'none'
    constraint hackathons_recurrence_check check (recurrence in ('none', 'annual')),
  add column parent_id uuid references hackathons(id) on delete set null;

comment on column hackathons.recurrence is
  'none or annual. annual events are rolled forward by the recurring cron job.';
comment on column hackathons.parent_id is
  'The edition this row was rolled forward from. Set only by rollRecurringEvents.';

-- One child per parent is what makes the roll idempotent: a second run finds
-- the child and creates nothing.
create unique index hackathons_parent_id_idx
  on hackathons (parent_id) where parent_id is not null;

-- `h.*` in a view is expanded at creation time, so the admin view has to be
-- recreated for the two new columns to show up in PostgREST.
drop view hackathons_admin;

create view hackathons_admin
with (security_invoker = true)
as
select
  h.*,
  st_y(h.location::geometry) as lat,
  st_x(h.location::geometry) as lng
from hackathons h;

revoke all on hackathons_admin from anon, authenticated;
grant select on hackathons_admin to service_role;
