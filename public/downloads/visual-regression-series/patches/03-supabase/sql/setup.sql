-- 僅在新的教學 Supabase Project 執行一次。
create table public.tutorial_comparisons (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 before_path text not null,
 after_path text not null,
 threshold real not null check(threshold between 0 and 1),
 changed_pixels integer not null check(changed_pixels>=0),
 total_pixels integer not null check(total_pixels>0 and changed_pixels<=total_pixels),
 width integer not null check(width between 1 and 4096),
 height integer not null check(height between 1 and 4096),
 algorithm text not null check(algorithm='pixelmatch-8.0.0'),
 created_at timestamptz not null default now(),
 check(total_pixels=width*height),
 check(before_path like owner_id::text||'/%'),
 check(after_path like owner_id::text||'/%')
);
create index tutorial_owner_created on public.tutorial_comparisons(owner_id,created_at desc);
alter table public.tutorial_comparisons enable row level security;
revoke all on public.tutorial_comparisons from anon,authenticated;
grant select,insert on public.tutorial_comparisons to authenticated;
create policy own_read on public.tutorial_comparisons for select to authenticated
 using((select auth.uid())=owner_id);
create policy own_insert on public.tutorial_comparisons for insert to authenticated
 with check((select auth.uid())=owner_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('tutorial-images','tutorial-images',false,5242880,array['image/png']);
create policy own_image_insert on storage.objects for insert to authenticated
 with check(bucket_id='tutorial-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_image_read on storage.objects for select to authenticated
 using(bucket_id='tutorial-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_image_delete on storage.objects for delete to authenticated
 using(bucket_id='tutorial-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
