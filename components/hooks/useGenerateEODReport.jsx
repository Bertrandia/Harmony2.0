// components/hooks/useGenerateEODReport.js
"use client"; // needed if using fetch in client components

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useGenerateEODReport() {
  const generateEODReport = async (summary = {}, tasks = [], patron = null) => {
    const doc = new jsPDF("p", "mm", "a4");

    // === HEADER (Orange Banner) ===
    doc.setFillColor(255, 128, 0);
    doc.rect(0, 0, 210, 25, "F");

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("End of Day Update", 14, 16);

    // === ADD LOGO (Top-Right Corner) ===
    try {
      const res = await fetch("/logo.png"); // public/logo.png
      const blob = await res.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve) => (reader.onloadend = resolve));
      const base64data = reader.result;

      // x, y, width, height (adjust to fit your header)
      doc.addImage(base64data, "PNG", 180, 2, 20, 20);
    } catch (err) {
      console.warn("Logo not added:", err);
    }

    // Reset text color for content
    doc.setTextColor(0, 0, 0);

    // === EXPENSE INFO HEADING ===
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("EXPENSE INFORMATION:", 14, 40);

    // === SUMMARY TEXT (Right Side) ===
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const summaryLines = [];
    if (summary.allTasksNum !== undefined)
      summaryLines.push(`TOTAL TASKS: ${summary.allTasksNum}`);
    if (summary.budgertLeft !== undefined)
      summaryLines.push(`LEFT ADVANCE AMOUNT: ${summary.budgertLeft}`);
    if (summary.todaysExpense !== undefined)
      summaryLines.push(`EXPENSES TODAY: ${summary.todaysExpense}`);
    if (summary.mtdExpense !== undefined)
      summaryLines.push(`EXPENSES MTD: ${summary.mtdExpense}`);

    summaryLines.forEach((line, i) => {
      doc.text(line, 200, 30 + i * 6, { align: "right" });
    });

    const formatDate = (date) => {
      if (!date) return "—";

      let d;

      if (date.toDate) d = date.toDate();
      else if (date instanceof Date) d = date;
      else if (typeof date === "string") {
        d = new Date(date);
        if (isNaN(d.getTime())) return "—";
      } else return "—";

      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }).format(d);
    };

    // === TASKS TABLE ===
    const tableData = tasks.map((t, i) => [
      i + 1,
      t.taskSubject || "—",
      t.taskStatusCategory || "—",
      t.taskStatusCategory || "—",
      formatDate(t.taskDueDate),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["S.No", "Details", "Update", "Current Status", "DueDate"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        valign: "middle",
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 128, 0],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "left", cellWidth: 70 },
        2: { halign: "center", cellWidth: 35 },
        3: { halign: "center", cellWidth: 40 },
        4: { halign: "center", cellWidth: 35 },
      },
    });

    // Save file
    const today = new Date().toISOString().slice(0, 10);
    const fileSafeName =
      patron?.patronName?.replace?.(/[^\w\-]+/g, "_") || "Patron";

    doc.save(`EOD_${fileSafeName}_${today}.pdf`);
  };

  return { generateEODReport };
}
