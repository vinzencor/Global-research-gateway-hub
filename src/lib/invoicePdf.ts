async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface InvoicePdfData {
  invoiceId: string;
  date: string;
  billToName: string;
  billToEmail: string;
  description: string;
  amount: number;
  currency?: string;
  status: string;
}

export async function downloadInvoicePdf(data: InvoicePdfData) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  const logoDataUrl = await loadImageAsDataUrl("/Logo.png");
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, "PNG", 15, 12, 36, 16);
    } catch {
      // Ignore unsupported image formats — invoice still generates without the logo.
    }
  }

  pdf.setFontSize(20);
  pdf.text("Invoice", 195, 20, { align: "right" });
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(`Invoice #: ${data.invoiceId}`, 195, 27, { align: "right" });
  pdf.text(`Date: ${data.date}`, 195, 32, { align: "right" });

  pdf.setDrawColor(210);
  pdf.line(15, 38, 195, 38);

  pdf.setTextColor(20);
  pdf.setFontSize(11);
  pdf.text("Billed To", 15, 48);
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(data.billToName, 15, 54);
  pdf.text(data.billToEmail, 15, 59);

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, 70, 180, 9, "F");
  pdf.setFontSize(10);
  pdf.setTextColor(20);
  pdf.text("Description", 18, 76);
  pdf.text("Status", 140, 76);
  pdf.text("Amount", 192, 76, { align: "right" });

  pdf.setFontSize(10);
  pdf.setTextColor(60);
  const descLines = pdf.splitTextToSize(data.description, 115);
  pdf.text(descLines, 18, 88);
  pdf.text(String(data.status).replace(/_/g, " "), 140, 88);
  pdf.text(`${data.currency || "INR"} ${data.amount.toFixed(2)}`, 192, 88, { align: "right" });

  const totalY = 88 + descLines.length * 5 + 12;
  pdf.setDrawColor(210);
  pdf.line(15, totalY - 6, 195, totalY - 6);
  pdf.setFontSize(12);
  pdf.setTextColor(20);
  pdf.text(`Total: ${data.currency || "INR"} ${data.amount.toFixed(2)}`, 192, totalY, { align: "right" });

  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text("This is a system-generated invoice.", 15, 285);

  pdf.save(`invoice-${data.invoiceId}.pdf`);
}
