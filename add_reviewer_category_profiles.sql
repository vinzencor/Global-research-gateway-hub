-- Run this in your Supabase SQL Editor to add the reviewer_category column to the profiles table
-- Supabase Dashboard → SQL Editor → New Query → paste this → Run

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reviewer_category text;
