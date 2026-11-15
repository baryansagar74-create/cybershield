import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Send,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import api from '../utils/api';
import Header from '../components/Header';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import SLATimer from '../components/SLATimer';
import FeatureBreakdown from '../components/FeatureBreakdown';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [noticeDraft, setNoticeDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await api.get(`/cases/${id}`);
        setCaseData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [id]);

  const handleUpdateStatus = async (newStatus, outcome = null) => {
    setUpdating(true);
    try {
      await api.patch(`/cases/${id}/status`, {
        status: newStatus,
        outcome,
      });
      const res = await api.get(`/cases/${id}`);
      setCaseData(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateNotice = async () => {
    try {
      const res = await api.post(`/cases/${id}/generate-notice`);
      setNoticeDraft(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Notice generation failed.');
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${api.defaults.baseURL}/reports/evidence-pdf/${id}`, '_blank');
  };

  if (loading || !caseData) {
    return <div className="p-8 text-center text-slate-500">Loading case dossier...</div>;
  }

  const { account, assessment, sla_info } = caseData;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Header
        title={`Case ${caseData.notice_ref}`}
        subtitle={`Investigating @${account.handle} on ${account.platform.toUpperCase()}`}
      />

      <main className="p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Navigation back and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Evidence PDF
            </button>

            <button
              onClick={handleGenerateNotice}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <FileText className="w-4 h-4" /> Review Sahyog Notice
            </button>
          </div>
        </div>

        {/* Overview banner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold text-slate-400">Target Profile</span>
              <RiskBadge band={assessment.band} />
              <span className="text-xs font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
                Status: {caseData.status}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">@{account.handle}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{account.profile_url || 'URL not provided'}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Statutory SLA Window</span>
            <SLATimer
              hoursRemaining={sla_info?.hours_remaining}
              isBreached={sla_info?.is_breached}
            />
            <p className="text-[11px] text-slate-400">
              Deadline: {new Date(caseData.sla_due_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Workflow Progression Controls */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="text-xs font-bold uppercase text-slate-600 mb-3">Takedown Lifecycle Stage</h4>
          <div className="flex flex-wrap gap-2">
            {caseData.status === 'draft' && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('submitted')}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Submit to Central Nodal Cell (I4C Sahyog)
              </button>
            )}

            {caseData.status === 'submitted' && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('platform_review')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Mark Notice Dispatched to Platform
              </button>
            )}

            {caseData.status === 'platform_review' && (
              <>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('resolved', 'Account suspended by platform')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Confirm Account Removed / Suspended
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('escalated', 'SLA breached: escalated to CERT-In / FIR')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Escalate (CERT-In / FIR under IT Act 66D)
                </button>
              </>
            )}

            {caseData.status === 'resolved' && (
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Case resolved. Account removed by intermediary.
              </div>
            )}
          </div>
        </div>

        {/* Notice Preview Modal / Drawer */}
        {noticeDraft && (
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Sahyog Structured Notice Draft (Sec 79(3)(b) IT Act)</span>
              </div>
              <button
                onClick={() => setNoticeDraft(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-lg overflow-x-auto">
              {noticeDraft.legal_notice_body}
            </pre>
            <div className="text-[11px] text-amber-300 italic">
              NOTE: Always confirm legal statutory citations with the ITBP legal cell prior to formal filing.
            </div>
          </div>
        )}

        {/* Technical Signals & Feature Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h4 className="font-bold text-slate-800 text-sm">Investigative Evidence & Model Evaluation</h4>
          <FeatureBreakdown features={assessment.features} explanation={{}} />
        </div>
      </main>
    </div>
  );
}
