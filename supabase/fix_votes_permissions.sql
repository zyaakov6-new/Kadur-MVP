-- FIX: Add missing permissions for deleting and updating votes
-- Run this in your Supabase SQL Editor

-- 1. Allow users to delete their own votes (Required for cancelling votes)
create policy "Users can delete their own votes"
  on votes for delete
  using ( auth.uid() = voter_id );

-- 2. Allow users to update their own votes (Required for switching votes)
create policy "Users can update their own votes"
  on votes for update
  using ( auth.uid() = voter_id );

-- Verify policies
select * from pg_policies where tablename = 'votes';
