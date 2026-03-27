import React from 'react';
import { Database, KeyRound, Server } from 'lucide-react';

export function SetupInstructions() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex items-center gap-3">
          <Database className="w-8 h-8" />
          <h1 className="text-2xl font-bold">需要配置 Supabase</h1>
        </div>
        
        <div className="p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              1. 环境变量
            </h2>
            <p className="mb-4">
              请将您的 Supabase 凭证添加到 AI Studio Secrets 面板或您的 <code>.env</code> 文件中：
            </p>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              VITE_SUPABASE_URL="your-project-url"<br/>
              VITE_SUPABASE_ANON_KEY="your-anon-key"
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              2. 数据库结构
            </h2>
            <p className="mb-4">
              在您的 Supabase SQL 编辑器中运行以下 SQL 以创建必要的表和行级安全 (RLS) 策略：
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`-- Create customers table
create table customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  company text,
  email text,
  phone text,
  status text default 'Lead',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for customers
alter table customers enable row level security;
create policy "Users can view own customers" on customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers" on customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers" on customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers" on customers for delete using (auth.uid() = user_id);

-- Create journeys table
create table journeys (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers on delete cascade not null,
  user_id uuid references auth.users not null,
  visit_date date not null,
  notes text not null,
  next_step text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for journeys
alter table journeys enable row level security;
create policy "Users can view own journeys" on journeys for select using (auth.uid() = user_id);
create policy "Users can insert own journeys" on journeys for insert with check (auth.uid() = user_id);
create policy "Users can update own journeys" on journeys for update using (auth.uid() = user_id);
create policy "Users can delete own journeys" on journeys for delete using (auth.uid() = user_id);`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
