-- Add pay-per-view price support for content items
alter table content_items
  add column if not exists ppv_price numeric(10,2) default 9.99;

alter table content_items drop constraint if exists content_items_ppv_price_check;
alter table content_items
  add constraint content_items_ppv_price_check
  check (ppv_price >= 0);

update content_items
set ppv_price = coalesce(ppv_price, 9.99)
where access_mode = 'pay_per_view' or visibility = 'pay_per_view';
