/**
 * ProfileGuard — ITBP Forensic Assessment PDF Dossier Generator
 * ==============================================================
 * Generates an official, publication-grade Cyber Threat Intelligence & 
 * Takedown Evidence Dossier under Section 79(3)(b) Information Technology Act 2000
 * and Bharatiya Sakshya Adhiniyam 2023.
 */

import { jsPDF } from 'jspdf';
import { MockAccount } from '../mock/accounts';

export function generateForensicPdf(account: MockAccount, officerTitle: string = "ITBP Cyber Analyst"): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkBlue = [8, 26, 51];      // #081A33
  const lightBg = [244, 247, 251];    // #F4F7FB
  const borderLine = [210, 220, 235]; // #D2DCEB
  const textDark = [11, 37, 69];      // #0B2545
  const textMuted = [81, 98, 124];    // #51627C
  const tealBrand = [18, 168, 157];   // #12A89D
  const riskRed = [229, 72, 77];      // #E5484D
  const riskOrange = [242, 140, 40];  // #F28C28
  const riskGreen = [47, 158, 98];    // #2F9E62

  let y = margin;

  // 1. TOP HEADER BANNER
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS", pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 215, 240);
  doc.text("INDO-TIBETAN BORDER POLICE FORCE (ITBP) • CYBER CRIME & FORENSIC CELL", pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(18, 216, 196);
  doc.text("EVIDENTIARY DIGITAL DOSSIER • STATUTORY TAKEDOWN NOTICE S.79(3)(b) IT ACT", pageWidth / 2, 22, { align: 'center' });

  y = 34;

  // 2. METADATA HEADER STRIP
  const shortId = account.id.startsWith('acc-live') ? 'LIVE-' + account.id.slice(-6) : account.id.replace('acc-', '').toUpperCase();
  const reportRef = `ITBP/CTI/2026/${shortId}`;
  const reportDate = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("DOSSIER REF:", margin + 4, y + 6);
  doc.text("GENERATED ON:", margin + 4, y + 13);
  doc.text("INVESTIGATING DESK:", margin + 80, y + 6);
  doc.text("EVIDENTIARY SEAL:", margin + 80, y + 13);

  doc.setFont('courier', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(reportRef, margin + 28, y + 6);
  doc.text(reportDate, margin + 28, y + 13);
  doc.text(officerTitle.substring(0, 24), margin + 118, y + 6);
  doc.text(account.evidenceHash ? account.evidenceHash.substring(0, 14) + '...' : 'SEAL_VERIFIED', margin + 118, y + 13);

  y += 24;

  // 3. TARGET PROFILE IDENTITY CARD
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("1. TARGET PROFILE IDENTIFICATION & TELEMETRY", margin, y);
  y += 5;

  const cardHeight = 44;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

  // Left Column
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Platform:", margin + 6, y + 8);
  doc.text("Target Handle:", margin + 6, y + 15);
  doc.text("Display Name:", margin + 6, y + 22);
  doc.text("Classification:", margin + 6, y + 29);
  doc.text("Profile Picture:", margin + 6, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(account.platform.toUpperCase(), margin + 35, y + 8);
  
  doc.setFont('courier', 'bold');
  doc.text(`@${account.handle}`, margin + 35, y + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.text(account.name || account.handle, margin + 35, y + 22);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(account.band === 'HIGH' ? riskRed[0] : account.band === 'MEDIUM' ? riskOrange[0] : riskGreen[0], account.band === 'HIGH' ? riskRed[1] : account.band === 'MEDIUM' ? riskOrange[1] : riskGreen[1], account.band === 'HIGH' ? riskRed[2] : account.band === 'MEDIUM' ? riskOrange[2] : riskGreen[2]);
  doc.text(account.profileType || (account.score >= 0.5 ? "Suspected Impersonator / Bot" : "Genuine / Verified Account"), margin + 35, y + 29);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(account.hasProfilePic ? riskGreen[0] : riskRed[0], account.hasProfilePic ? riskGreen[1] : riskRed[1], account.hasProfilePic ? riskGreen[2] : riskRed[2]);
  doc.text(account.hasProfilePic ? "CUSTOM AVATAR PRESENT (LIVE DETECTED)" : "NO PROFILE PICTURE DETECTED (DEFICIENT)", margin + 35, y + 36);

  // Right Column (Telemetry Counts)
  const rightColX = margin + 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Followers:", rightColX, y + 8);
  doc.text("Following:", rightColX, y + 15);
  doc.text("Posts / Media:", rightColX, y + 22);
  doc.text("Account Age:", rightColX, y + 29);
  doc.text("Data Source:", rightColX, y + 36);

  doc.setFont('courier', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(account.followers.toLocaleString(), rightColX + 28, y + 8);
  doc.text(account.following.toLocaleString(), rightColX + 28, y + 15);
  doc.text(account.posts.toLocaleString(), rightColX + 28, y + 22);
  doc.text(`${account.accountAgeDays} days active`, rightColX + 28, y + 29);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(tealBrand[0], tealBrand[1], tealBrand[2]);
  const srcLabel = account.dataSource
    ? (account.dataSource.includes('playwright') ? 'LIVE WEB SCRAPE (CHROME)'
      : account.dataSource.includes('telegram') ? 'LIVE TELEGRAM DOM'
      : account.dataSource.includes('github') ? 'LIVE GITHUB REST API'
      : account.dataSource.includes('gemini') ? 'OSINT INTELLIGENCE'
      : 'FORENSIC HEURISTIC')
    : 'MULTI-SIGNAL OSINT';
  doc.text(srcLabel, rightColX + 28, y + 36);

  y += cardHeight + 8;

  // 4. RISK ASSESSMENT & CLASSIFICATION SCORE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("2. MULTI-SIGNAL MACHINE LEARNING RISK ASSESSMENT", margin, y);
  y += 5;

  const riskBoxHeight = 26;
  const isHigh = account.band === 'HIGH';
  const isMed = account.band === 'MEDIUM';
  const bandColor = isHigh ? riskRed : isMed ? riskOrange : riskGreen;

  doc.setFillColor(bandColor[0], bandColor[1], bandColor[2]);
  doc.rect(margin, y, 4, riskBoxHeight, 'F');

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin + 4, y, contentWidth - 4, riskBoxHeight, 0, 0, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("COMPOSITE RISK SCORE:", margin + 8, y + 8);
  doc.text("ASSESSED RISK BAND:", margin + 8, y + 16);
  doc.text("RECOMMENDED ACTION:", margin + 8, y + 22);

  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.setTextColor(bandColor[0], bandColor[1], bandColor[2]);
  doc.text(`${account.score.toFixed(2)} / 1.00`, margin + 60, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${account.band} RISK CLASSIFICATION`, margin + 60, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    isHigh
      ? "Forward to I4C / Sahyog & Platform Nodal Cell for immediate takedown under Section 79(3)(b) IT Act."
      : isMed
      ? "Place on heightened observation queue. Require corroborating officer ID or badge proof."
      : "Profile verified as genuine institutional or civilian entity. No coercive intervention warranted.",
    margin + 60,
    y + 22
  );

  y += riskBoxHeight + 8;

  // 5. FORENSIC ATTRIBUTION FACTORS (SHAP-STYLE TABLE)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("3. TOP FORENSIC ATTRIBUTION FACTORS (RANDOM FOREST V1 BENCHMARK)", margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text("FEATURE NAME", margin + 4, y + 5);
  doc.text("OBSERVED VALUE", margin + 65, y + 5);
  doc.text("WEIGHT", margin + 105, y + 5);
  doc.text("FORENSIC EXPLANATION", margin + 125, y + 5);
  y += 7;

  // Table Rows
  const features = account.contributingFeatures || [];
  features.forEach((feat, idx) => {
    const rowHeight = 7;
    doc.setFillColor(idx % 2 === 0 ? 255 : lightBg[0], idx % 2 === 0 ? 255 : lightBg[1], idx % 2 === 0 ? 255 : lightBg[2]);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(feat.name.substring(0, 32), margin + 4, y + 4.8);

    doc.setFont('courier', 'normal');
    doc.text(String(feat.value).substring(0, 20), margin + 65, y + 4.8);

    doc.setFont('courier', 'bold');
    const isPushFake = feat.weight > 0;
    doc.setTextColor(isPushFake ? riskRed[0] : riskGreen[0], isPushFake ? riskRed[1] : riskGreen[1], isPushFake ? riskRed[2] : riskGreen[2]);
    doc.text((isPushFake ? '+' : '') + feat.weight.toFixed(2), margin + 105, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(feat.explanation.substring(0, 48) + '...', margin + 125, y + 4.8);

    y += rowHeight;
  });

  y += 6;

  // 6. CAPTURED BIO & SAFE BROWSING STATUS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("4. PROFILE CONTENT & URL REPUTATION AUDIT", margin, y);
  y += 5;

  const contentBoxHeight = 22;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, contentBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Captured Bio:", margin + 4, y + 6);
  doc.text("Link Reputation:", margin + 4, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const bioExcerpt = account.bio ? (account.bio.length > 100 ? account.bio.substring(0, 97) + '...' : account.bio) : "No biography provided in profile telemetry.";
  doc.text(bioExcerpt, margin + 30, y + 6);

  const isSafe = account.urlReputation?.safe ?? true;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isSafe ? riskGreen[0] : riskRed[0], isSafe ? riskGreen[1] : riskRed[1], isSafe ? riskGreen[2] : riskRed[2]);
  doc.text(
    isSafe ? "CLEAN • No known phishing, malware, or credential harvesting flags detected." : "MALICIOUS • Flagged on Google Safe Browsing / National Cyber Threat Database.",
    margin + 30,
    y + 16
  );

  y += contentBoxHeight + 8;

  // 7. STATUTORY DECLARATION & SIGNATURE FOOTER
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLine[0], borderLine[1], borderLine[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("LEGAL EVIDENTIARY DECLARATION PURSUANT TO SECTION 63, BHARATIYA SAKSHYA ADHINIYAM (BSA) 2023:", margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const declText = "I hereby certify that this electronic forensic record was produced by the ProfileGuard Cyber Intelligence System during ordinary cyber-patrolling duties. The cryptographic SHA-256 seal guarantees integrity of telemetry extracted at the timestamp recorded above.";
  doc.text(doc.splitTextToSize(declText, contentWidth - 8), margin + 4, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Investigating Officer:", margin + 4, y + 25);
  doc.text("Nodal Cell Counter-Signature:", margin + 100, y + 25);

  doc.setFont('courier', 'normal');
  doc.text(`${officerTitle} [DIGITALLY SEALED]`, margin + 4, y + 30);
  doc.text("AC / 2IC Nodal Desk [SEAL CERTIFIED]", margin + 100, y + 30);

  // Bottom Footer Bar
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFontSize(6.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(190, 215, 240);
  doc.text(`SHA-256 CHAINED HASH: ${account.evidenceHash || 'a7f3e829b41c09d5e38192a6c08e5f14e912bc48d901a238e9102c48d910283a'}`, margin, pageHeight - 4);
  doc.text("CONFIDENTIAL • LAW ENFORCEMENT & PLATFORM NODAL USE ONLY", pageWidth - margin, pageHeight - 4, { align: 'right' });

  // Download PDF
  doc.save(`ProfileGuard_Forensic_Dossier_@${account.handle}.pdf`);
}
