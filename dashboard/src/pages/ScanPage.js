import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, AlertCircle, FilePlus2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import Header from '../components/Header';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import FeatureBreakdown from '../components/FeatureBreakdown';

export default function ScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [platform, setPlatform] = useState(searchParams.get('platform') || 'x');
  const [handleOrUrl, setHandleOrUrl] = useState(searchParams.get('target') || '');
  const [customData, setCustomData] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [caseCreated, setCaseCreated] = useState(null);

  useEffect(() => {
    const p = searchParams.get('platform');
    const t = searchParams.get('target');
    if (p) setPlatform(p);
    if (t) setHandleOrUrl(t);
  }, [searchParams]);

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!handleOrUrl.trim()) return;

    setErrorMsg('');
    setLoading(true);
    setScanResult(null);
    setCaseCreated(null);

    let parsedRaw = null;
    if (customData.trim()) {
      try {
        parsedRaw = JSON.parse(customData);
      } catch (err) {
        setErrorMsg('Invalid JSON in custom profile data block.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.post('/scan/profile', {
        platform,
        handle_or_url: handleOrUrl,
        raw_profile_data: parsedRaw,
      });
      setScanResult(response.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to complete profile risk scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!scanResult) return;
    try {
      const response = await api.post('/cases', {
        assessment_id: scanResult.assessment_id,
        trigger_type: 'urgent_complaint',
      });
      setCaseCreated(response.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to initialize takedown case.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title="Profile Assessment Engine"
        subtitle="Multi-signal Heuristic, ML and NLP Analysis"
      />

      <main className="p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Form card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                >
                  <option value="x">X (Twitter)</option>
                  <option value="instagram">Instagram (Meta)</option>
                  <option value="facebook">Facebook</option>
                  <option value="telegram">Telegram</option>
                  <option value="general">Generic OSINT</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Account Handle or URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={handleOrUrl}
                    onChange={(e) => setHandleOrUrl(e.target.value)}
                    placeholder="e.g. officer_rajesh_8841 or https://x.com/officer_rajesh_8841"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0B2545] hover:bg-[#134074] text-white px-6 py-2 rounded-lg text-sm font-semibold shadow transition disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? 'Evaluating...' : 'Run Scan'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500">Quick Test Cases:</span>
              <button
                type="button"
                onClick={() => {
                  setPlatform('x');
                  setHandleOrUrl('officer_rajesh_8841');
                  setCustomData(JSON.stringify({
                    followers: 12,
                    following: 2400,
                    posts: 2,
                    account_age_days: 9,
                    has_profile_pic: 0,
                    bio: 'ITBP Officer 🇮🇳 Urgent help needed via DM',
                    bio_length: 38,
                    username_digit_ratio: 0.5,
                    external_url: 1,
                    name_username_match: 0
                  }, null, 2));
                }}
                className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded font-medium transition"
              >
                🚨 Fake Officer Impersonator
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatform('instagram');
                  setHandleOrUrl('itbp_recruit_2024');
                  setCustomData(JSON.stringify({
                    followers: 95,
                    following: 1300,
                    posts: 14,
                    account_age_days: 40,
                    has_profile_pic: 1,
                    bio: 'Official ITBP Recruitment 2026. Apply at http://itbp-jobs.tk',
                    bio_length: 56,
                    username_digit_ratio: 0.2,
                    external_url: 1,
                    name_username_match: 0
                  }, null, 2));
                }}
                className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-medium transition"
              >
                ⚠️ Phishing Recruitment Scam
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatform('x');
                  setHandleOrUrl('priya.sharma');
                  setCustomData(JSON.stringify({
                    followers: 640,
                    following: 410,
                    posts: 210,
                    account_age_days: 1100,
                    has_profile_pic: 1,
                    bio: 'Civilian enthusiast. Nature and border patrol supporter.',
                    bio_length: 54,
                    username_digit_ratio: 0.0,
                    external_url: 0,
                    name_username_match: 1
                  }, null, 2));
                }}
                className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded font-medium transition"
              >
                ✅ Verified Genuine Profile
              </button>
            </div>

            {/* Optional manual override JSON input */}
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-800 font-medium">
                Advanced: Inspect or Customize Captured Profile Features (JSON)
              </summary>
              <textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                placeholder='{"followers": 12, "following": 2400, "posts": 2, "account_age_days": 9, "has_profile_pic": 0, "username_digit_ratio": 0.5}'
                rows={4}
                className="w-full mt-2 font-mono border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
              />
            </details>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Scan Results Presentation */}
        {scanResult && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Target Evaluated
                </span>
                <h3 className="text-2xl font-black text-slate-800">
                  @{scanResult.handle} <span className="text-sm font-normal text-slate-500">on {scanResult.platform.toUpperCase()}</span>
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <RiskBadge band={scanResult.band} />
                {!caseCreated ? (
                  <button
                    onClick={handleCreateCase}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    Open Takedown Case
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Case Ref: {caseCreated.notice_ref}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Risk Gauge */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-200">
                <RiskGauge score={scanResult.score} />
                <p className="text-xs text-center text-slate-500 mt-2">
                  Model Version: <span className="font-mono">{scanResult.model_version}</span>
                </p>
              </div>

              {/* Signals and Flags */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Detected Indicators</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-xs font-bold text-slate-500 uppercase">Text / Bio Analysis</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      Risk Score: {(scanResult.text_analysis?.text_risk_score * 100 || 0).toFixed(0)}%
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scanResult.text_analysis?.flags?.length ? (
                        scanResult.text_analysis.flags.map((f, i) => (
                          <span key={i} className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No text red-flags</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-xs font-bold text-slate-500 uppercase">External Links / Phishing</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      Threat Detected: {scanResult.url_analysis?.threat_detected ? 'YES' : 'NO'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Analyzed URLs: {scanResult.url_analysis?.analyzed_urls?.length || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-2">Feature Breakdown</h4>
                  <FeatureBreakdown
                    features={scanResult.features}
                    explanation={scanResult.explanation}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
