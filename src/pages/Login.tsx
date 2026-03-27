import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Lock, Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('注册成功！请检查您的邮箱以获取确认链接。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || '认证过程中发生错误。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-[#24292f] rounded-full flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-light tracking-tight text-[#24292f]">
          {isSignUp ? '创建您的账户' : '登录您的账户'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#f6f8fa] py-8 px-4 sm:px-10">
          <div className="bg-white py-6 px-4 shadow-sm border border-[#d0d7de] sm:rounded-lg sm:px-6 mb-4">
            <form className="space-y-4" onSubmit={handleAuth}>
              {error && (
                <div className="bg-[#ffebe9] border border-[#ff8182] text-[#cf222e] px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-[#dafbe1] border border-[#4ac26b] text-[#1a7f37] px-4 py-3 rounded-md text-sm">
                  {message}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[#24292f] mb-1">
                  邮箱地址
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-[#0969da] focus:border-[#0969da] block w-full pl-9 sm:text-sm border-[#d0d7de] rounded-md py-1.5 bg-[#f6f8fa] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#24292f] mb-1">
                  密码
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-[#0969da] focus:border-[#0969da] block w-full pl-9 sm:text-sm border-[#d0d7de] rounded-md py-1.5 bg-[#f6f8fa] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-1.5 px-4 border border-[rgba(27,31,36,0.15)] rounded-md shadow-sm text-sm font-medium text-white bg-[#2da44e] hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2da44e] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    isSignUp ? '注册' : '登录'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="border border-[#d0d7de] rounded-md p-4 text-center text-sm text-[#24292f] bg-white">
            {isSignUp ? '已有账户？' : 'CRM 新用户？'}
            {' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#0969da] hover:underline focus:outline-none"
            >
              {isSignUp ? '登录' : '创建账户'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
