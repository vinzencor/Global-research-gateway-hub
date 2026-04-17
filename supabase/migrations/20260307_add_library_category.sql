-- Backward-compatibility: some clients still send/read library_items.category
-- Add the column safely so old and new app builds both work.

alter table library_items
  add column if not exists category text;

-- Optional normalization for blank strings
update library_items
set category = null
where category = '';

create index if not exists idx_library_items_category on library_items(category);
