import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Customer, type Journey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, FileText, Plus, MapPin, Mic, Square, Loader2, Paperclip, X, Download } from 'lucide-react';
import { format } from 'date-fns';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [visitDate, setVisitDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    if (!supabase || !id) return;
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch journeys
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('customer_id', id)
        .order('visit_date', { ascending: false });
      
      if (journeyError) throw journeyError;
      setJourneys(journeyData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user || !id) return;

    const finalNotes = transcript.trim() 
      ? `${notes}\n\n--- Audio Transcript ---\n${transcript}`
      : notes;

    setIsUploading(true);
    let attachment_url = null;
    let attachment_name = null;

    if (attachment) {
      try {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        attachment_url = publicUrl;
        attachment_name = attachment.name;
      } catch (error: any) {
        console.error('Error uploading attachment:', error);
        alert(`上传失败：${error.message || '未知错误'}。请检查您的 Supabase 存储策略 (RLS)，确保已认证用户具有 "attachments" 存储桶的 INSERT 权限。`);
        setIsUploading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('journeys')
        .insert([
          {
            customer_id: id,
            user_id: user.id,
            visit_date: visitDate,
            notes: finalNotes,
            next_step: nextStep,
            attachment_url,
            attachment_name,
          }
        ])
        .select();

      if (error) throw error;
      
      if (data) {
        setJourneys([data[0], ...journeys].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()));
        setShowModal(false);
        setNotes('');
        setTranscript('');
        setNextStep('');
        setAttachment(null);
      }
    } catch (error) {
      console.error('Error adding journey:', error);
      alert('添加旅程记录失败');
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = () => {
    // @ts-ignore - SpeechRecognition is not standard in all TS environments
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        stopRecording();
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer) {
    return <div>未找到客户</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#57606a]" />
        </Link>
        <div>
          <h1 className="text-2xl font-normal text-[#24292f]">{customer.name}</h1>
          <p className="text-sm text-[#57606a]">{customer.company || '未指定公司'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="bg-white border border-[#d0d7de] rounded-md p-6 h-fit">
          <h2 className="text-lg font-semibold text-[#24292f] mb-4 border-b border-[#d0d7de] pb-2">联系信息</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-[#57606a]">邮箱</dt>
              <dd className="mt-1 text-sm text-[#24292f]">{customer.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#57606a]">电话</dt>
              <dd className="mt-1 text-sm text-[#24292f]">{customer.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#57606a]">状态</dt>
              <dd className="mt-1">
                <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full border border-[#d0d7de] text-[#57606a]">
                  {customer.status === 'Lead' ? '潜在客户' : customer.status === 'Active' ? '活跃' : customer.status === 'Inactive' ? '非活跃' : customer.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Journeys Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#d0d7de] rounded-md p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#d0d7de] pb-4">
            <h2 className="text-lg font-semibold text-[#24292f]">客户旅程</h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-[rgba(27,31,36,0.15)] text-sm font-medium rounded-md text-white bg-[#2da44e] hover:bg-[#2c974b] transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加拜访记录
            </button>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {journeys.length === 0 ? (
                <li className="py-8 text-center text-[#57606a]">
                  暂无拜访记录。添加一条记录开始追踪客户旅程！
                </li>
              ) : (
                journeys.map((journey, journeyIdx) => (
                  <li key={journey.id}>
                    <div className="relative pb-8">
                      {journeyIdx !== journeys.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#d0d7de]" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center ring-8 ring-white">
                            <MapPin className="h-4 w-4 text-[#57606a]" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div className="w-full">
                            <p className="text-sm text-[#57606a]">
                              拜访于 <span className="font-medium text-[#24292f]">{format(new Date(journey.visit_date), 'yyyy年MM月dd日')}</span>
                            </p>
                            <div className="mt-2 text-sm text-[#24292f] bg-[#f6f8fa] rounded-md p-3 border border-[#d0d7de]">
                              <p className="whitespace-pre-wrap">{journey.notes}</p>
                            </div>
                            {journey.next_step && (
                              <div className="mt-2 flex items-start gap-2 text-sm text-[#0969da] bg-[#ddf4ff] rounded-md p-2 border border-[#54aeff]/40">
                                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-semibold">下一步：</span>
                                  {journey.next_step}
                                </div>
                              </div>
                            )}
                            {journey.attachment_url && (
                              <div className="mt-2">
                                <a 
                                  href={journey.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#24292f] bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors"
                                >
                                  <Paperclip className="w-4 h-4 text-[#57606a]" />
                                  <span className="truncate max-w-[200px]">{journey.attachment_name || '附件'}</span>
                                  <Download className="w-4 h-4 text-[#57606a] ml-1" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Add Journey Modal */}
      {showModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl border border-[#d0d7de] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-semibold text-[#24292f] mb-4">添加拜访记录</h3>
                <form onSubmit={handleAddJourney} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">拜访日期 *</label>
                    <input type="date" required value={visitDate} onChange={e => setVisitDate(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">手动笔记 *</label>
                    <textarea required rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="讨论了什么？"></textarea>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-[#24292f]">语音转录</label>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${
                          isRecording 
                            ? 'border-[#ff8182] text-[#cf222e] bg-[#ffebe9] hover:bg-[#ffdce0]' 
                            : 'border-[#d0d7de] text-[#24292f] bg-[#f6f8fa] hover:bg-[#f3f4f6]'
                        } transition-colors`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-3 h-3 mr-1 fill-current" />
                            停止录音
                          </>
                        ) : (
                          <>
                            <Mic className="w-3 h-3 mr-1" />
                            录制语音
                          </>
                        )}
                      </button>
                    </div>
                    <textarea rows={3} value={transcript} onChange={e => setTranscript(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="录制语音以生成转录，或在此处输入..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">下一步（可选）</label>
                    <input type="text" value={nextStep} onChange={e => setNextStep(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="例如：周五前发送提案" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#24292f] mb-1">附件（可选）</label>
                    {attachment ? (
                      <div className="flex items-center justify-between p-2 border border-[#d0d7de] rounded-md bg-[#f6f8fa]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Paperclip className="w-4 h-4 text-[#57606a] flex-shrink-0" />
                          <span className="text-sm text-[#24292f] truncate">{attachment.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setAttachment(null)}
                          className="p-1 text-[#57606a] hover:text-[#cf222e] rounded-md hover:bg-[#ffebe9] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#d0d7de] border-dashed rounded-md hover:bg-[#f6f8fa] transition-colors relative">
                        <div className="space-y-1 text-center">
                          <Paperclip className="mx-auto h-8 w-8 text-[#57606a]" />
                          <div className="flex text-sm text-[#57606a] justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-[#0969da] hover:text-[#0969da]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#0969da]">
                              <span>上传文件</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                            </label>
                            <p className="pl-1">或拖放至此处</p>
                          </div>
                          <p className="text-xs text-[#57606a]">支持 10MB 以内的任意文件</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit" disabled={isUploading} className="w-full inline-flex justify-center items-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#2da44e] text-sm font-medium text-white hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2da44e] sm:col-start-2 transition-colors disabled:opacity-50">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存记录'
                      )}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} disabled={isUploading} className="mt-3 w-full inline-flex justify-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#f6f8fa] text-sm font-medium text-[#24292f] hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0969da] sm:mt-0 sm:col-start-1 transition-colors disabled:opacity-50">
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
