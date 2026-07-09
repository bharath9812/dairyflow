'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function BasicInterfaceSettings() {
  const [volumeTags, setVolumeTags] = useState(['+5L', '+10L', '+20L']);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

  const handleAddTag = () => {
    if (newTagValue.trim()) {
      let tag = newTagValue.trim();
      if (/^\d+$/.test(tag)) {
        tag = `+${tag}L`;
      }
      if (!volumeTags.includes(tag)) {
        setVolumeTags([...volumeTags, tag]);
      }
    }
    setNewTagValue('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setVolumeTags(volumeTags.filter(tag => tag !== tagToDelete));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* App Theme */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4 col-span-1 md:col-span-2">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            App Theme

          </h2>
        </header>
        <div className="flex flex-wrap gap-4 mt-2">
          {['Light', 'Dark', 'System', 'High Contrast / Outdoor'].map((theme, i) => (
            <label key={theme} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <input type="radio" name="theme" value={theme} defaultChecked={i === 0} className="text-black focus:ring-black checked:bg-black accent-black h-4 w-4" />
              <span className="font-semibold text-sm text-onyx">{theme}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Font Size Scaling */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            Font Size Scaling

          </h2>
        </header>
        <div className="flex items-center gap-4 mt-2">
          <span className="font-medium text-slate-500 text-sm">A</span>
          <input type="range" min="80" max="150" defaultValue="100" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black" />
          <span className="font-bold text-slate-500 text-lg">A</span>
        </div>
      </section>

      {/* Language & Region */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            Localization

          </h2>
        </header>
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Language</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx">
              <option>English</option>
              <option>TELUGU</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Timezone & Region</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx">
              <option>DD/MM/YYYY (IST)</option>
              <option>MM/DD/YYYY (EST)</option>
              <option>YYYY-MM-DD (UTC)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Entry Configuration */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4 col-span-1 md:col-span-2">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            Entry Configuration

          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Volume Quick-Actions</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {volumeTags.map((tag) => (
                <span key={tag} className="group flex items-center gap-1 bg-slate-100 text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">
                  {tag}
                  <button type="button" onClick={() => handleDeleteTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-slate-300 text-slate-500 hover:text-black focus:opacity-100 outline-none">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <input
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="e.g. 50"
                    className="bg-transparent border-none outline-none w-16 text-xs font-bold text-black p-0 focus:ring-0 placeholder:text-slate-400"
                    autoFocus
                    onBlur={() => {
                      setTimeout(() => {
                        if (!newTagValue.trim()) setIsAddingTag(false);
                      }, 100);
                    }}
                  />
                  <button type="button" onClick={handleAddTag} className="text-black hover:text-slate-700 bg-slate-200 p-0.5 rounded-full">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsAddingTag(true)} className="border border-slate-300 text-slate-500 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border-dashed hover:bg-slate-50 flex items-center gap-1 transition-colors outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
                  <Plus className="w-3 h-3" /> Add Tag
                </button>
              )}
            </div>
            <div className="flex flex-col gap-5 mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-onyx">Smart Shift Auto-Select</span>

                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 pl-3 border-l-2 border-slate-200">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Morning Shift Range</label>
                  <div className="flex items-center gap-2">
                    <input type="time" defaultValue="03:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx" />
                    <span className="text-slate-400 text-xs font-medium">to</span>
                    <input type="time" defaultValue="13:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evening Shift Range</label>
                  <div className="flex items-center gap-2">
                    <input type="time" defaultValue="15:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx" />
                    <span className="text-slate-400 text-xs font-medium">to</span>
                    <input type="time" defaultValue="23:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">High-Volume Warning Threshold</label>
            <div className="flex items-center gap-3">
              <input type="number" defaultValue="100" className="w-24 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx" />
              <span className="font-semibold text-sm text-slate-500">Liters</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-2 tracking-wide">Alerts if entry exceeds this amount.</p>
          </div>
        </div>
      </section>

      {/* Audio & Interactions */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            Feedback & Hotkeys

          </h2>
        </header>
        <div className="flex flex-col gap-6 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-onyx">Success/Error Sounds</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          <div>
            <label className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              <span>Toast Duration</span>
              <span className="text-onyx">3s</span>
            </label>
            <input type="range" min="1" max="10" defaultValue="3" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-onyx">Power-User Hotkeys</span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide mt-0.5">e.g., Alt+C to clear, Enter to submit</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
        <header className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-onyx flex items-center gap-2">
            Security

          </h2>
        </header>
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              <span>Inactivity Lock</span>
              <span className="text-onyx">15 mins</span>
            </label>
            <input type="range" min="1" max="60" defaultValue="15" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black" />
            <p className="text-[11px] font-medium text-slate-400 mt-3 tracking-wide leading-relaxed">Screen will lock and display a subtle ambient animation after inactivity.</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-2 mb-8">
        <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-onyx transition-all">
          Reset Defaults
        </button>
        <button className="px-6 py-2.5 rounded-xl font-bold text-sm bg-onyx text-white shadow-sm hover:opacity-90 transition-all active:scale-[0.98]">
          Save Changes
        </button>
      </div>

    </div>
  );
}
