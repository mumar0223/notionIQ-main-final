import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportConversationToPDF(
  conversationTitle: string,
  messages: any[]
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(conversationTitle, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  for (const message of messages) {
    const role = message.role === "user" ? "You" : "AI";
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(role, margin, yPosition);
    yPosition += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const lines = pdf.splitTextToSize(
      message.content,
      pageWidth - 2 * margin
    );

    for (const line of lines) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 8;
  }

  return pdf;
}

export function downloadPDF(pdf: jsPDF, filename: string) {
  pdf.save(filename);
}

export async function exportSingleMessageToPDF(message: any, index: number) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Chat Message #${index + 1}`, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  const role = message.role === "user" ? "You" : "AI";
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(role, margin, yPosition);
  yPosition += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  const lines = pdf.splitTextToSize(
    message.content,
    pageWidth - 2 * margin
  );

  for (const line of lines) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += 6;
  }

  return pdf;
}
