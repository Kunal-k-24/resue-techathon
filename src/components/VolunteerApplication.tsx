import React, { useState } from 'react';
import { Shield, Send, CheckCircle, Loader2, HeartPulse, Award, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VolunteerApplicationProps {
  profile: any;
  onComplete: () => void;
}

export default function VolunteerApplication({ profile, onComplete }: VolunteerApplicationProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    skills: '',
    experience: '',
    reason: '',
    contact_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('volunteer_applications').insert({
        profile_id: profile.id,
        full_name: profile.full_name,
        skills: formData.skills.split(',').map(s => s.trim()),
        experience: formData.experience,
        reason: formData.reason,
        contact_number: formData.contact_number,
      });

      if (error) throw error;
      setSubmitted(true);
      // Optional: auto-refresh or wait for admin
      setTimeout(() => onComplete(), 3000); 
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full text-center shadow-2xl animate-scale-in border border-slate-100">
          <div className="bg-emerald-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Application Sent!</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            Your application is now under review by our administration team. You will gain access to the volunteer dashboard once approved.
          </p>
          <div className="bg-slate-50 p-6 rounded-[2rem] text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">What's next?</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm font-bold text-slate-600">
                <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm">1</div>
                Admin verifies your credentials
              </li>
              <li className="flex gap-3 text-sm font-bold text-slate-600">
                <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm">2</div>
                Background check completed
              </li>
              <li className="flex gap-3 text-sm font-bold text-slate-600">
                <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm">3</div>
                Dashboard access granted via email
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
          <div className="bg-red-600 p-10 md:p-16 text-white text-center relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10">
              <Shield className="w-16 h-16 mx-auto mb-6 text-red-200" />
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-4">Volunteer Application</h1>
              <p className="text-red-100 font-medium max-w-lg mx-auto">
                Help us understand your capabilities better so we can assign you to the right rescue missions.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <HeartPulse className="w-4 h-4" /> Skills & Expertise
                  </label>
                  <textarea
                    required
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300 min-h-[120px]"
                    placeholder="E.g. First Aid, CPR, Truck Driving, Swimming (Comma separated)"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <Award className="w-4 h-4" /> Relevant Experience
                  </label>
                  <textarea
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300 min-h-[120px]"
                    placeholder="Tell us about any previous rescue or volunteer work you've done."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <BookOpen className="w-4 h-4" /> Why do you want to help?
                  </label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300 min-h-[120px]"
                    placeholder="Your motivation for joining the rescue network."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <Send className="w-4 h-4" /> Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Submit Application <Send className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
