-- The moderation pages need coordinates as numbers, for every status, not just
-- published ones. PostgREST cannot unpack a geography column, so the view does
-- it the same way hackathons_public does.
create view hackathons_admin
with (security_invoker = true)
as
select
  h.*,
  st_y(h.location::geometry) as lat,
  st_x(h.location::geometry) as lng
from hackathons h;

-- Service role only. The anon key must keep seeing published rows and nothing
-- else, so it gets no privilege here at all.
revoke all on hackathons_admin from anon, authenticated;
grant select on hackathons_admin to service_role;
