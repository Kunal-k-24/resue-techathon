import { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, MapPin, Info, Send } from 'lucide-react';
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

  const incidentTypes: { value: IncidentType; label: string; color: string; icon: any }[] = [
    { value: 'fire', label: 'Fire', color: 'bg-red-500', icon: '🔥' },
    { value: 'flood', label: 'Flood', color: 'bg-blue-500', icon: '🌊' },
    { value: 'earthquake', label: 'Earthquake', color: 'bg-orange-500', icon: '🏘️' },
    { value: 'medical', label: 'Medical', color: 'bg-emerald-500', icon: '🚑' },
    { value: 'other', label: 'Other', color: 'bg-slate-500', icon: '❓' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { error } = await supabase.from('incidents').insert({
        type: formData.type,
        description: formData.description,
        location_name: formData.location,
        status: 'pending',
        urgency: formData.type === 'medical' ? 'high' : 'medium'
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
          <div className="bg-emerald-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight italic">Report Live!</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Emergency teams have been dispatched to the coordinates provided. Stay safe and wait for instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-slide-up border border-slate-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Report Incident</h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Provide accurate details for faster response.</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              <Info className="w-4 h-4" /> Incident Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    formData.type === type.value
                      ? `${type.color.replace('bg-', 'border-')} ${type.color.replace('bg-', 'bg-')}/10 shadow-lg scale-105`
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${
                    formData.type === type.value ? type.color.replace('bg-', 'text-') : 'text-slate-400'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              <MapPin className="w-4 h-4" /> Location Information
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where is this happening?"
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold placeholder:font-medium placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              <AlertCircle className="w-4 h-4" /> Description & Severity
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's happening? (e.g., casualties, trapped people, spreading fast...)"
              rows={4}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium placeholder:text-slate-300 resize-none"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              <Upload className="w-4 h-4" /> Attach Evidence (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              {imagePreview ? (
                <div className="relative group rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-xl">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 hover:border-orange-500 transition-all group"
                >
                  <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-orange-50 transition-colors">
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-orange-500" />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-600">Add Photos</p>
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.type || !formData.location || !formData.description}
              className="flex-1 bg-orange-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Dispatch Report'} <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

