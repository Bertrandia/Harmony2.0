// components/hooks/useGenerateEODReport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useGenerateEODReport() {
  const generateEODReport = (summary = {}, tasks = [], patron = null) => {
    const doc = new jsPDF("p", "mm", "a4");

    // === HEADER (Orange Banner with Logo Placeholder) ===
    doc.setFillColor(255, 128, 0); // brighter orange to match screenshot
    doc.rect(0, 0, 210, 25, "F");

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("End of Day Update", 14, 16);

    // Reset text color for content
    doc.setTextColor(0, 0, 0);

    // === EXPENSE INFO HEADING ===
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("EXPENSE INFORMATION:", 14, 40);

    // === SUMMARY TEXT (RIGHT SIDE) ===
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

      // Firestore Timestamp
      if (date.toDate) {
        d = date.toDate();
      }
      // JS Date
      else if (date instanceof Date) {
        d = date;
      }
      // ISO string or other string
      else if (typeof date === "string") {
        d = new Date(date);
        if (isNaN(d.getTime())) return "—";
      } else {
        return "—";
      }

      // ✅ Format as dd/mm/yy
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
        fillColor: [255, 128, 0], // orange header
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 }, // S.No
        1: { halign: "left", cellWidth: 70 }, // Details
        2: { halign: "center", cellWidth: 35 }, // Update
        3: { halign: "center", cellWidth: 40 }, // Current Status
        4: { halign: "center", cellWidth: 35 }, // Due Date
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
