import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// === Convert file → Base64 ===
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

// === Format Date (Firestore Timestamp or Date) ===
const formatDate = (timestamp) => {
  if (timestamp?.toDate) timestamp = timestamp.toDate();
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

// === Generate PDF & Upload to Firebase ===
export default async function handleGeneratePDF(cashMemoDataForm, userId) {
  const {
    vendorName,
    soldTo,
    invoiceDate,
    items,
    totalAmount,
    file,
    invoiceNumber,
  } = cashMemoDataForm;

  const doc = new jsPDF();

  // --- Layout Sizes ---
  const tableWidth = 180;
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = (pageWidth - tableWidth) / 2;

  // === HEADER BAR ===
  const y = 20;
  const barHeight = 10;

  doc.setFillColor("#febd55");
  doc.rect(leftMargin, y, tableWidth, barHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");

  // Approx vertical centering
  const textY = y + barHeight / 2 + 1.1; // 3 ≈ half of font size (12pt ≈ 3mm)
  doc.text("Cash Memo", pageWidth / 2, textY, { align: "center" });

  // Reset for later text
  doc.setFont(undefined, "normal");

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // === DETAILS ===
  let yStart = y + barHeight + 10;
  const lineHeight = 6;
  const labelWidth = 40;

  const details = [
    ["Vendor Name:", vendorName],
    ["Invoice Number:", invoiceNumber],
    ["Invoice Date:", formatDate(invoiceDate)],
    ["Sold To:", soldTo],
  ];

  details.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, leftMargin, yStart);
    doc.setFont(undefined, "normal");
    doc.text(value || "", leftMargin + labelWidth, yStart);
    yStart += lineHeight;
  });

  // === TABLE ===
  const bodyData = items.map((item, idx) => [
    idx + 1,
    item.itemName,
    item.itemDescription,
    item.itemUnits,
    item.itemRate,
    item.itemQuantity,
    item.itemTotal,
  ]);

 bodyData.push([
  {
    content: "", // skip first 5 columns
    colSpan: 5,
    styles: { cellPadding: 0, lineWidth: 0, halign: "center" }, // no content, no borders
  },
  {
    content: "Total",
    styles: {
      halign: "right",
      fontStyle: "bold",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0], // border
      lineWidth: 0.3,
    },
  },
  {
    content: `${Number(totalAmount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`,
    styles: {
      halign: "center",
      fontStyle: "bold",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0], // border
      lineWidth: 0.3,
    },
  },
]);



  autoTable(doc, {
    startY: yStart + 7,
    margin: { left: leftMargin, right: leftMargin },
    tableWidth: tableWidth,
    head: [["S.No", "Item", "Description", "Unit", "Rate", "Qty", "Amount"]],
    body: bodyData,
    theme: "grid", // ⬅️ important to keep borders
    styles: {
      fontSize: 9,
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [252, 200, 114],
      textColor: [0, 0, 0],
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
  });

  // === IMAGE ATTACHMENT ===
  if (file && file.type?.startsWith("image/")) {
    const imgData = await fileToBase64(file);
    const image = new Image();
    image.src = imgData;
    await new Promise((res) => (image.onload = res));

    const mmWidth = image.width * 0.264583;
    const mmHeight = image.height * 0.264583;

    const pageHeight = doc.internal.pageSize.getHeight();
    const scale = Math.min(pageWidth / mmWidth, pageHeight / mmHeight, 1);

    const finalWidth = mmWidth * scale;
    const finalHeight = mmHeight * scale;
    const imgX = (pageWidth - finalWidth) / 2;
    const imgY = (pageHeight - finalHeight) / 2;

    doc.addPage();
    doc.addImage(
      imgData,
      file.type.includes("jpeg") || file.type.includes("jpg") ? "JPEG" : "PNG",
      imgX,
      imgY,
      finalWidth,
      finalHeight
    );
  }

  // === PDF ATTACHMENT ===
  if (file && file.type === "application/pdf") {
    const generatedPdfBytes = doc.output("arraybuffer");
    const existingPdfBytes = await file.arrayBuffer();

    const mergedPdf = await PDFDocument.create();
    const [cashMemoPdf, uploadedPdf] = await Promise.all([
      PDFDocument.load(generatedPdfBytes),
      PDFDocument.load(existingPdfBytes),
    ]);

    const cashMemoPages = await mergedPdf.copyPages(
      cashMemoPdf,
      cashMemoPdf.getPageIndices()
    );
    const uploadedPages = await mergedPdf.copyPages(
      uploadedPdf,
      uploadedPdf.getPageIndices()
    );

    cashMemoPages.forEach((p) => mergedPdf.addPage(p));
    uploadedPages.forEach((p) => mergedPdf.addPage(p));

    const finalMergedPdf = await mergedPdf.save();
    const blob = new Blob([finalMergedPdf], { type: "application/pdf" });

    // --- Upload to Firebase ---
    return await uploadToFirebase(blob, userId, invoiceNumber);
  }

  // === Default (Generated PDF only) ===
  const pdfBlob = doc.output("blob");

  // doc.save(`${invoiceNumber}.pdf`);
  // --- Upload to Firebase ---
  return await uploadToFirebase(pdfBlob, userId, invoiceNumber);
}

// === Firebase Upload Helper ===
async function uploadToFirebase(fileBlob, userId, invoiceNumber) {
  const storage = getStorage();
  const fileName = `${Date.now()}_${invoiceNumber}.pdf`;
  const fileRef = ref(storage, `users/${userId}/createCashMemo/${fileName}`);

  await uploadBytes(fileRef, fileBlob);
  const downloadURL = await getDownloadURL(fileRef);

  return downloadURL; // 🔥 Return this URL for Firestore or UI
}
