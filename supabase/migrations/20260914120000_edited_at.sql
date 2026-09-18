-- Marks a row a human has corrected by hand. The write path reads it: an edited
-- row only gets its still-empty columns filled by a later seed or import, so a
-- corrected name or pin survives the next `npm run seed`.
alter table hackathons add column edited_at timestamptz;

comment on column hackathons.edited_at is
  'Set by admin edits. Non-null means automated writes may only fill null columns.';
