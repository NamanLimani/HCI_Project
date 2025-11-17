import jsPDF from 'jspdf';

export function exportAnalysisToPDF(analysis, articleUrl) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight = 20) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text, x, y, maxWidth, fontSize = 10, lineHeight = 5) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.setFontSize(fontSize);
    doc.text(lines, x, y);
    return lines.length * lineHeight;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Full Analysis Report', margin, yPos);
  yPos += 10;

  // Article URL
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  const urlLines = doc.splitTextToSize(`Analyzed: ${articleUrl}`, maxWidth);
  doc.text(urlLines, margin, yPos);
  yPos += urlLines.length * 5 + 5;
  doc.setTextColor(0, 0, 0);

  // Summary Section
  if (analysis.siteAnalysis || analysis.sentiment || analysis.authorship) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Site Analysis
    if (analysis.siteAnalysis) {
      const sa = analysis.siteAnalysis;
      doc.setFont(undefined, 'bold');
      doc.text('Site Reputation:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      doc.text(`Domain: ${sa.domain || 'N/A'}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Reputation: ${sa.reputation || 'Unknown'}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Political Bias: ${sa.politicalBias || 'N/A'}`, margin + 5, yPos);
      yPos += 5;
    }

    // Sentiment
    if (analysis.sentiment) {
      checkPageBreak(15);
      doc.setFont(undefined, 'bold');
      doc.text('Sentiment Analysis:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      doc.text(`Sentiment: ${analysis.sentiment.sentiment || 'N/A'}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Bias: ${analysis.sentiment.bias || 'N/A'}`, margin + 5, yPos);
      yPos += 5;
      if (analysis.sentiment.explanation) {
        const expHeight = addWrappedText(analysis.sentiment.explanation, margin + 5, yPos, maxWidth - 5, 9, 4);
        yPos += expHeight + 3;
      }
    }

    // Authorship
    if (analysis.authorship) {
      checkPageBreak(15);
      doc.setFont(undefined, 'bold');
      doc.text('Authorship Analysis:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      if (analysis.authorship.explanation) {
        const authHeight = addWrappedText(analysis.authorship.explanation, margin + 5, yPos, maxWidth - 5, 9, 4);
        yPos += authHeight + 3;
      }
    }

    yPos += 5;
  }

  // Claims Section
  if (analysis.results && analysis.results.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Claims Analysis', margin, yPos);
    yPos += 8;

    // Stats
    const verified = analysis.results.filter(c => c.status === 'Verified').length;
    const questionable = analysis.results.filter(c => c.status === 'Questionable').length;
    const disputed = analysis.results.filter(c => c.status === 'Disputed').length;
    const total = verified + questionable + disputed;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Claims: ${total} (✓ Verified: ${verified}, ⚠ Questionable: ${questionable}, ✗ Disputed: ${disputed})`, margin, yPos);
    yPos += 8;

    // Each claim
    analysis.results.forEach((claim, index) => {
      checkPageBreak(40);

      // Claim number and status
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      const statusColor = claim.status === 'Verified' ? [34, 197, 94] : 
                         claim.status === 'Questionable' ? [234, 179, 8] : 
                         [239, 68, 68];
      doc.setTextColor(...statusColor);
      doc.text(`Claim ${index + 1}: ${claim.status}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 6;

      // Claim text
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const claimHeight = addWrappedText(claim.claim, margin, yPos, maxWidth, 10, 5);
      yPos += claimHeight + 3;

      // Source
      if (claim.source) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Source: ${claim.source}`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }

      // Source URL (as hyperlink)
      if (claim.sourceUrl) {
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        const linkText = 'View Source';
        const textWidth = doc.getTextWidth(linkText);
        doc.text(linkText, margin, yPos);
        doc.link(margin, yPos - 4, textWidth, 5, { url: claim.sourceUrl });
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }

      // Explanation
      if (claim.explanation) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const expHeight = addWrappedText(claim.explanation, margin, yPos, maxWidth, 9, 4);
        yPos += expHeight + 3;
        doc.setTextColor(0, 0, 0);
      }

      yPos += 5; // Space between claims
    });
  }

  // Footer on last page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} - Generated by Verify Extension`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  // Save the PDF
  const fileName = `verify-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

