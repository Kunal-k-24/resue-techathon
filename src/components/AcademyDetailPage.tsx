import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Users, BookOpen, Clock, 
  CheckCircle, Loader2, GraduationCap, Plus, Trash2, ChevronDown, ChevronUp,
  Layout, ListChecks, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AcademyDetailPageProps {
  moduleId: string;
  onBack: () => void;
}

export default function AcademyDetailPage({ moduleId, onBack }: AcademyDetailPageProps) {
  const [module, setModule] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration_minutes: 0,
    content: '', // Legacy content field
  });
  const [chapterForm, setChapterForm] = useState<any[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [generatingAiIndex, setGeneratingAiIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [moduleId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moduleRes, volunteersRes, assignmentsRes, chaptersRes] = await Promise.all([
        supabase.from('training_modules').select('*').eq('id', moduleId).single(),
        supabase.from('profiles').select('*').eq('role', 'volunteer'),
        supabase.from('module_assignments').select('*, profiles(full_name)').eq('module_id', moduleId),
        supabase.from('training_chapters').select('*').eq('module_id', moduleId).order('order_index', { ascending: true })
      ]);

      if (moduleRes.data) {
        setModule(moduleRes.data);
        setFormData({
          title: moduleRes.data.title,
          description: moduleRes.data.description,
          category: moduleRes.data.category,
          duration_minutes: moduleRes.data.duration_minutes,
          content: moduleRes.data.content
        });
      }
      
      const fetchedChapters = chaptersRes.data || [];
      setChapters(fetchedChapters);
      setChapterForm(fetchedChapters.length > 0 ? fetchedChapters : [{ title: 'Chapter 1', content: '', order_index: 0 }]);
      
      setVolunteers(volunteersRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModule = async () => {
    setSaving(true);
    try {
      // 1. Update module basics
      const { error: moduleError } = await supabase
        .from('training_modules')
        .update(formData)
        .eq('id', moduleId);

      if (moduleError) throw moduleError;

      // 2. Update/Insert Chapters
      // Delete existing chapters first for simplicity in this hackathon context
      await supabase.from('training_chapters').delete().eq('module_id', moduleId);
      
      const chaptersToInsert = chapterForm.map((ch, idx) => ({
        module_id: moduleId,
        title: ch.title,
        content: ch.content,
        order_index: idx
      }));

      const { error: chapterError } = await supabase
        .from('training_chapters')
        .insert(chaptersToInsert);

      if (chapterError) throw chapterError;

      setModule({ ...module, ...formData });
      setChapters(chaptersToInsert);
      setEditMode(false);
      alert('Module and Chapters updated successfully!');
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module.');
    } finally {
      setSaving(false);
    }
  };

  const addChapter = () => {
    setChapterForm([...chapterForm, { title: `Chapter ${chapterForm.length + 1}`, content: '', order_index: chapterForm.length }]);
  };

  const removeChapter = (index: number) => {
    if (chapterForm.length <= 1) return;
    setChapterForm(chapterForm.filter((_, i) => i !== index));
  };

  const updateChapter = (index: number, field: string, value: string) => {
    const newChapters = [...chapterForm];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapterForm(newChapters);
  };

  const handleAiGenerateChapter = async (index: number) => {
    const chapter = chapterForm[index];
    if (!chapter.title) {
      alert('Please provide a chapter title first.');
      return;
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      alert('OpenRouter API Key not found. Please add VITE_OPENROUTER_API_KEY to your .env file.');
      return;
    }

    setGeneratingAiIndex(index);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Rescue Academy",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [
            {
              "role": "system",
              "content": "You are a professional emergency response training expert. Generate a detailed, professional training chapter in Markdown format. ONLY output the markdown content. Do NOT include any conversational preamble, greetings, or meta-talk like 'Here is the markdown'."
            },
            {
              "role": "user",
              "content": `Generate a professional training chapter for a module titled "${formData.title}". 
              The specific chapter title is "${chapter.title}". 
              Include an introduction, technical procedures, safety protocols, and a summary. 
              Use professional terminology suitable for emergency responders.`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter Error:', errorData);
        throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API Response structure:', data);
        throw new Error('Invalid response structure from AI provider');
      }

      let generatedContent = data.choices[0].message.content.trim();

      // Clean up markdown code blocks if the AI wrapped the response in them
      if (generatedContent.includes('```markdown')) {
        generatedContent = generatedContent.split('```markdown')[1].split('```')[0].trim();
      } else if (generatedContent.startsWith('```')) {
        generatedContent = generatedContent.split('```')[1].split('```')[0].trim();
      }

      updateChapter(index, 'content', generatedContent);
      alert(`AI has generated professional content for: ${chapter.title}`);
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      alert(`AI Generation Failed: ${error.message}. Please try again in a few moments.`);
      
      // Fallback content generation in case of API failure to keep the user moving
      const fallbackContent = `
# ${chapter.title} (Draft)
*Note: AI Generation was temporarily unavailable. This is a basic template.*

## Overview
This section covers the fundamentals of ${chapter.title} within the ${formData.title} curriculum.

## Standard Operating Procedures
1. Initial site assessment.
2. Deployment of specialized ${formData.title} equipment.
3. Continuous monitoring of environmental hazards.

## Safety Guidelines
Always maintain line-of-sight with your partner and follow the established communication protocols.
`.trim();
      updateChapter(index, 'content', fallbackContent);
    } finally {
      setGeneratingAiIndex(null);
    }
  };

  // Filter out volunteers who are already assigned
  const availableVolunteers = volunteers.filter(v => 
    !assignments.some(asgn => asgn.volunteer_id === v.id)
  );

  const handleAssignVolunteers = async () => {
    if (selectedVolunteers.length === 0) return;
    setSaving(true);
    try {
      const newAssignments = selectedVolunteers.map(vId => ({
        module_id: moduleId,
        volunteer_id: vId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('module_assignments')
        .upsert(newAssignments, { onConflict: 'module_id,volunteer_id' });

      if (error) throw error;
      alert(`Assigned to ${selectedVolunteers.length} volunteers!`);
      setSelectedVolunteers([]);
      fetchData();
    } catch (error) {
      console.error('Error assigning volunteers:', error);
      alert('Failed to assign volunteers.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Editor/Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editMode ? 'Edit Module' : module?.title}
                  </h1>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                    Academy Curriculum Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  editMode ? 'bg-slate-100 text-slate-600' : 'bg-purple-600 text-white shadow-lg shadow-purple-100 hover:bg-purple-700'
                }`}
              >
                {editMode ? 'Cancel' : 'Edit Content'}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-600" />
                    Module Essentials
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                      >
                        <option value="First Aid">First Aid</option>
                        <option value="Fire Safety">Fire Safety</option>
                        <option value="Search & Rescue">Search & Rescue</option>
                        <option value="Emergency Comm">Emergency Comm</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Overview Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold resize-none outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-purple-600" />
                      Curriculum Chapters
                    </h3>
                    <button
                      onClick={addChapter}
                      className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-100 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Add Chapter
                    </button>
                  </div>

                  <div className="space-y-4">
                    {chapterForm.map((ch, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-400">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={ch.title}
                              onChange={e => updateChapter(idx, 'title', e.target.value)}
                              placeholder="Chapter Title"
                              className="bg-transparent font-black text-slate-900 outline-none focus:text-purple-600 w-64"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAiGenerateChapter(idx)}
                              disabled={generatingAiIndex !== null}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                              title="Generate content with AI"
                            >
                              {generatingAiIndex === idx ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                              AI Generate
                            </button>
                            <button
                              onClick={() => removeChapter(idx)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-6">
                          <textarea
                            rows={6}
                            value={ch.content}
                            onChange={e => updateChapter(idx, 'content', e.target.value)}
                            placeholder="Chapter content (Markdown supported)..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm resize-none outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 custom-scrollbar"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleUpdateModule}
                  disabled={saving}
                  className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Publish Curriculum
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{module?.duration_minutes}m Duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{module?.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{assignments.length} Enrolled</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Chapter Navigation */}
                  <div className="md:col-span-1 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-2">Course Content</h4>
                    {chapters.map((ch, idx) => (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChapterIndex(idx)}
                        className={`w-full text-left p-4 rounded-2xl transition-all group flex items-center justify-between ${
                          activeChapterIndex === idx 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' 
                            : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black ${activeChapterIndex === idx ? 'text-purple-200' : 'text-slate-300'}`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-xs font-black truncate max-w-[120px]">{ch.title}</span>
                        </div>
                        {activeChapterIndex === idx ? (
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        ) : (
                          <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-30 rotate-90" />
                        )}
                      </button>
                    ))}
                    {chapters.length === 0 && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 italic">No chapters defined yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Chapter Content */}
                  <div className="md:col-span-3">
                    {chapters[activeChapterIndex] ? (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                          <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            Chapter {activeChapterIndex + 1}
                          </span>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{chapters[activeChapterIndex].title}</h2>
                        </div>
                        <div className="prose prose-slate max-w-none">
                          <div className="whitespace-pre-wrap font-medium text-slate-600 leading-relaxed text-base bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                            {chapters[activeChapterIndex].content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                          <BookOpen className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Select a Chapter</h3>
                        <p className="text-slate-400 text-sm font-medium">Click on a chapter from the list to view its content.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Assignments & Volunteers */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Enrollment
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Volunteers</label>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {availableVolunteers.length} Available
                </span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {availableVolunteers.map(v => (
                  <label key={v.id} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-purple-100 cursor-pointer transition-all border border-transparent hover:border-purple-100 group">
                    <input 
                      type="checkbox"
                      checked={selectedVolunteers.includes(v.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedVolunteers([...selectedVolunteers, v.id]);
                        else setSelectedVolunteers(selectedVolunteers.filter(id => id !== v.id));
                      }}
                      className="w-5 h-5 rounded-lg border-slate-300 text-purple-600 focus:ring-purple-500/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 leading-none mb-1 group-hover:text-purple-600 transition-colors">{v.full_name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{v.status}</span>
                    </div>
                  </label>
                ))}
                {availableVolunteers.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 italic">All active volunteers are already enrolled.</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleAssignVolunteers}
                disabled={selectedVolunteers.length === 0 || saving}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-100 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Enroll Selected ({selectedVolunteers.length})
              </button>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4 ml-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Students</h4>
                <span className="text-[10px] font-black text-slate-400">{assignments.length}</span>
              </div>
              
              <div className="space-y-3">
                {assignments.map(asgn => (
                  <div key={asgn.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{asgn.profiles?.full_name}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 mt-1 ${
                        asgn.status === 'completed' ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${asgn.status === 'completed' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                        {asgn.status}
                      </span>
                    </div>
                    {asgn.status === 'completed' ? (
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="text-xs font-bold text-slate-400 text-center py-8 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">No volunteers enrolled yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
