import { useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, MapPin, Info, Send, Camera, Image as ImageIcon } from 'lucide-react';
import { IncidentType } from '../types';
import { supabase } from '../lib/supabase';

interface ReportIncidentFormProps {
  onClose: () => void;
}

export default function ReportIncidentForm({ onClose }: ReportIncidentFormProps) {
  const [formData, setFormData] = useState({
    type: '' as IncidentType | '',
    description: '',
    location: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const incidentTypes: { value: IncidentType; label: string; color: string; icon: string }[] = [
    { value: 'fire', label: 'Fire', color: 'bg-red-500', icon: '🔥' },
    { value: 'flood', label: 'Flood', color: 'bg-blue-500', icon: '🌊' },
    { value: 'earthquake', label: 'Earthquake', color: 'bg-orange-500', icon: '🏘️' },
    { value: 'storm', label: 'Storm', color: 'bg-purple-500', icon: '⚡' },
    { value: 'medical', label: 'Medical', color: 'bg-emerald-500', icon: '🚑' },
    { value: 'sos', label: 'SOS', color: 'bg-red-600', icon: '🆘' },
    { value: 'other', label: 'Other', color: 'bg-slate-500', icon: '❓' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.location || !formData.description) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('incidents').insert({
        type: formData.type,
        description: formData.description,
        location_name: formData.location,
        status: 'pending',
        urgency: formData.type === 'medical' || formData.type === 'sos' ? 'critical' : 'high',
        image_url: imagePreview, // Storing as base64 for simplicity in hackathon, or can be upgraded to Storage
        reporter_id: user?.id
      });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Error submitting incident:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl animate-scale-in border border-slate-100">
          <div className="bg-emerald-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight italic">Report Received!</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Emergency teams have been notified. Stay calm, stay safe, and keep your phone accessible for updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-10 max-w-3xl w-full shadow-2xl animate-slide-up border border-slate-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest">Live Report</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Crisis <span className="text-red-600">Reporting</span></h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Direct link to emergency command centers.</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">
              <Info className="w-4 h-4 text-red-500" /> 1. Select Incident Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    formData.type === type.value
                      ? `${type.color.replace('bg-', 'border-')} ${type.color.replace('bg-', 'bg-')}/10 shadow-xl scale-105`
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight ${
                    formData.type === type.value ? type.color.replace('bg-', 'text-') : 'text-slate-400'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">
                  <MapPin className="w-4 h-4 text-orange-500" /> 2. Location
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Area or Street Address"
                    className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold placeholder:font-medium placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" /> 3. Situation Details
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's happening? casualties, trapped people, etc."
                  rows={4}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-300 resize-none"
                  required
                />
              </div>
            </div>

            {/* Evidence / Photos */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">
                <Camera className="w-4 h-4 text-purple-500" /> 4. Evidence (Camera/Gallery)
              </label>
              
              <div className="relative h-[260px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                  ref={fileInputRef}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="camera-capture"
                  ref={cameraInputRef}
                />

                {imagePreview ? (
                  <div className="relative h-full group rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="bg-red-500 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all active:scale-95"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 h-full">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-purple-500 transition-all group"
                    >
                      <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-purple-50 transition-colors">
                        <Camera className="w-8 h-8 text-slate-300 group-hover:text-purple-500" />
                      </div>
                      <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-purple-600">Open Camera</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-500 transition-all group"
                    >
                      <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-blue-50 transition-colors">
                        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                      </div>
                      <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">From Gallery</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || !formData.type || !formData.location || !formData.description}
              className="flex-1 bg-red-600 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center gap-2 italic">
                  Dispatching Responders...
                </span>
              ) : (
                <>
                  <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                  Submit Incident Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

