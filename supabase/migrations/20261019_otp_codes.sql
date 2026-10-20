-- ═══════════════════════════════════════════════════════════
-- OTP Codes · جدول رموز التحقّق للـلتسجيل بالجوال
-- ═══════════════════════════════════════════════════════════

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  attempts smallint not null default 0,
  verified boolean not null default false,
  purpose text not null default 'login',   -- login | signup | reset
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists idx_otp_phone on public.otp_codes(phone);
create index if not exists idx_otp_expires on public.otp_codes(expires_at);
create index if not exists idx_otp_phone_active on public.otp_codes(phone, verified, expires_at);

-- Rate limiting: ما يقدر يطلب كود أكثر من 5 في 10 دقائق
comment on table public.otp_codes is 'OTP codes for phone verification · auto-expires in 10 min';

-- RLS: لا أحد يقرأ هذا الجدول من الـclient (كل التحقق في الـserver)
alter table public.otp_codes enable row level security;

-- فقط service_role يقدر يكتب/يقرا
create policy "service_role_only" on public.otp_codes
  for all using (auth.role() = 'service_role');

-- دالة تنظيف تلقائي للرموز المنتهية (كل ساعة)
create or replace function cleanup_expired_otps()
returns void as $$
begin
  delete from public.otp_codes
  where expires_at < now() - interval '1 hour';
end;
$$ language plpgsql security definer;

-- لتفعيل التنظيف التلقائي: شغّلي هذا في Supabase (pg_cron):
-- select cron.schedule('cleanup-otps', '0 * * * *', $$select cleanup_expired_otps()$$);
