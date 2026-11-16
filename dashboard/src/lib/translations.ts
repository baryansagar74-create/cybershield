export type Language = 'en' | 'hi';

export const translations = {
  en: {
    appTitle: "ProfileGuard",
    appSubtitle: "ITBP Nodal Cyber Cell Workstation",
    illustrativeNotice: "Illustrative Data Only • Synthetic Research Prototype",
    footerPolicy: "No notice is sent without analyst and nodal-cell approval.",
    nav: {
      dashboard: "Dashboard",
      scan: "Scan profile",
      queue: "Flagged queue",
      cases: "Cases",
      audit: "Audit log",
      nodal: "Nodal cell",
      settings: "Settings & System",
      signOut: "Sign out"
    },
    dashboard: {
      title: "Operational Overview",
      subtitle: "Multi-signal fake account detection and SLA telemetry",
      statScannedToday: "Scanned today",
      statHighRisk: "High risk identified",
      statReported: "Notices transmitted",
      statRemoved: "Confirmed removed",
      trendTitle: "14-day detection vs takedown volume",
      slaTitle: "Nearest statutory SLA deadlines",
      flaggedTableTitle: "Active flagged targets requiring action",
      sendToCell: "Send to cell",
      viewAll: "View all in queue"
    },
    scan: {
      title: "Profile Assessment Ingestion",
      subtitle: "Enter public handle or drop evidentiary screenshot",
      inputPlaceholder: "Enter handle or URL (e.g. @cristiano, @durov)",
      dropzoneText: "Drop profile screenshot or click to browse",
      runScanBtn: "Start multi-signal scan",
      pipelineTitle: "Evaluation pipeline progress"
    },
    assessment: {
      title: "Forensic Assessment Dossier",
      riskScoreLabel: "Risk probability score",
      whyThisScore: "Why this score (top contributing features)",
      urlReputation: "Google Safe Browsing & link reputation",
      imageMatch: "ITBP insignia & perceptual hash match",
      confirmFake: "Confirm as fake",
      markGenuine: "Mark as genuine",
      needEvidence: "Needs more evidence"
    }
  },
  hi: {
    appTitle: "प्रोफाइल गार्ड",
    appSubtitle: "आईटीबीपी नोडल साइबर सेल वर्कस्टेशन",
    illustrativeNotice: "केवल दृष्टांतकारी डेटा • अनुसंधान प्रोटोटाइप",
    footerPolicy: "विश्लेषक और नोडल सेल की मंजूरी के बिना कोई नोटिस नहीं भेजा जाता है।",
    nav: {
      dashboard: "डैशबोर्ड",
      scan: "प्रोफ़ाइल स्कैन",
      queue: "चिह्नित सूची",
      cases: "मामले",
      audit: "ऑडिट लॉग",
      nodal: "नोडल सेल",
      settings: "सेटिंग्स व डिज़ाइन",
      signOut: "लॉग आउट"
    },
    dashboard: {
      title: "कार्यकारी अवलोकन",
      subtitle: "मल्टी-सिग्नल फर्जी खाता पहचान और एसएलए टेलीमेट्री",
      statScannedToday: "आज स्कैन किए गए",
      statHighRisk: "उच्च जोखिम चिह्नित",
      statReported: "प्रेषित नोटिस",
      statRemoved: "पुष्ट निष्कासन",
      trendTitle: "14-दिवसीय पहचान बनाम निष्कासन रुझान",
      slaTitle: "निकटतम वैधानिक एसएलए समय-सीमा",
      flaggedTableTitle: "कार्रवाई योग्य सक्रिय संदिग्ध लक्ष्य",
      sendToCell: "सेल को भेजें",
      viewAll: "सभी कतार देखें"
    },
    scan: {
      title: "प्रोफ़ाइल मूल्यांकन अंतर्ग्रहण",
      subtitle: "सार्वजनिक हैंडल दर्ज करें या स्क्रीनशॉट अपलोड करें",
      inputPlaceholder: "हैंडल या लिंक दर्ज करें (उदा. @cristiano, @durov)",
      dropzoneText: "स्क्रीनशॉट यहाँ खींचें या ब्राउज़ करें",
      runScanBtn: "मल्टी-सिग्नल स्कैन शुरू करें",
      pipelineTitle: "मूल्यांकन पाइपलाइन प्रगति"
    },
    assessment: {
      title: "फोरेंसिक मूल्यांकन डोजियर",
      riskScoreLabel: "जोखिम संभावना स्कोर",
      whyThisScore: "यह स्कोर क्यों (शीर्ष योगदान कारक)",
      urlReputation: "गूगल सेफ ब्राउज़िंग व लिंक प्रतिष्ठा",
      imageMatch: "आईटीबीपी प्रतीक चिह्न व छवि मिलान",
      confirmFake: "फर्जी के रूप में पुष्टि करें",
      markGenuine: "वास्तविक चिह्नित करें",
      needEvidence: "अतिरिक्त साक्ष्य आवश्यक"
    }
  }
};
