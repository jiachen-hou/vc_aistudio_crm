import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Customer, type Journey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, FileText, Plus, MapPin, Mic, Square, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { GoogleGenAI } from '@google/genai';

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

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      }
    } catch (error) {
      console.error('Error adding journey:', error);
      alert('Failed to add journey record');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
      });
      
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: 'Please transcribe the following audio accurately. Only output the transcription, nothing else.' },
            { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64data } }
          ]
        }
      });
      
      const transcription = response.text?.trim() || '';
      if (transcription) {
        setTranscript(prev => prev ? `${prev}\n${transcription}` : transcription);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
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
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 bg-white border border-[#d0d7de] rounded-md hover:bg-[#f6f8fa] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#57606a]" />
        </Link>
        <div>
          <h1 className="text-2xl font-normal text-[#24292f]">{customer.name}</h1>
          <p className="text-sm text-[#57606a]">{customer.company || 'No company specified'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="bg-white border border-[#d0d7de] rounded-md p-6 h-fit">
          <h2 className="text-lg font-semibold text-[#24292f] mb-4 border-b border-[#d0d7de] pb-2">Contact Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-[#57606a]">Email</dt>
              <dd className="mt-1 text-sm text-[#24292f]">{customer.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#57606a]">Phone</dt>
              <dd className="mt-1 text-sm text-[#24292f]">{customer.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#57606a]">Status</dt>
              <dd className="mt-1">
                <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full border border-[#d0d7de] text-[#57606a]">
                  {customer.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Journeys Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#d0d7de] rounded-md p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#d0d7de] pb-4">
            <h2 className="text-lg font-semibold text-[#24292f]">Customer Journey</h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-[rgba(27,31,36,0.15)] text-sm font-medium rounded-md text-white bg-[#2da44e] hover:bg-[#2c974b] transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Visit Record
            </button>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {journeys.length === 0 ? (
                <li className="py-8 text-center text-[#57606a]">
                  No visit records yet. Add one to start tracking the journey!
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
                              Visited on <span className="font-medium text-[#24292f]">{format(new Date(journey.visit_date), 'MMM d, yyyy')}</span>
                            </p>
                            <div className="mt-2 text-sm text-[#24292f] bg-[#f6f8fa] rounded-md p-3 border border-[#d0d7de]">
                              <p className="whitespace-pre-wrap">{journey.notes}</p>
                            </div>
                            {journey.next_step && (
                              <div className="mt-2 flex items-start gap-2 text-sm text-[#0969da] bg-[#ddf4ff] rounded-md p-2 border border-[#54aeff]/40">
                                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-semibold">Next Step: </span>
                                  {journey.next_step}
                                </div>
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
                <h3 className="text-lg leading-6 font-semibold text-[#24292f] mb-4">Add Visit Record</h3>
                <form onSubmit={handleAddJourney} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Visit Date *</label>
                    <input type="date" required value={visitDate} onChange={e => setVisitDate(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Manual Notes *</label>
                    <textarea required rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="What was discussed?"></textarea>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-[#24292f]">Audio Transcript</label>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${
                          isRecording 
                            ? 'border-[#ff8182] text-[#cf222e] bg-[#ffebe9] hover:bg-[#ffdce0]' 
                            : 'border-[#d0d7de] text-[#24292f] bg-[#f6f8fa] hover:bg-[#f3f4f6]'
                        } transition-colors disabled:opacity-50`}
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Transcribing...
                          </>
                        ) : isRecording ? (
                          <>
                            <Square className="w-3 h-3 mr-1 fill-current" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-3 h-3 mr-1" />
                            Record Audio
                          </>
                        )}
                      </button>
                    </div>
                    <textarea rows={3} value={transcript} onChange={e => setTranscript(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="Record audio to generate transcript, or type here..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#24292f]">Next Step (Optional)</label>
                    <input type="text" value={nextStep} onChange={e => setNextStep(e.target.value)} className="mt-1 block w-full border border-[#d0d7de] rounded-md shadow-sm py-1.5 px-3 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors" placeholder="e.g., Send proposal by Friday" />
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#2da44e] text-sm font-medium text-white hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2da44e] sm:col-start-2 transition-colors">
                      Save Record
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-[rgba(27,31,36,0.15)] shadow-sm px-4 py-1.5 bg-[#f6f8fa] text-sm font-medium text-[#24292f] hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0969da] sm:mt-0 sm:col-start-1 transition-colors">
                      Cancel
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
