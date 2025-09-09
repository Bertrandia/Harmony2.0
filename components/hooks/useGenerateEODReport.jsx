"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useGenerateEODReport() {
  const generateEODReport = async (
    summary = {},
    tasks = [],
    invoices = [],
    patron = null,
    options = {
      includeAdvance: true,
      includeTasks: true,
      includeInvoices: true,
    }
  ) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 10;
    const contentWidth = 190;
    const headerHeight = 25;

    // === Load Logo ===
    let logoBase64 = null;
    try {
      const res = await fetch("/logo.png");
      const blob = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve) => (reader.onloadend = resolve));
      logoBase64 = reader.result;
    } catch (err) {
      console.warn("Logo not added:", err);
    }

    // === HEADER DRAW FUNCTION (for all pages) ===
    const drawHeader = () => {
      doc.setFillColor(249, 165, 66); // #F9A542
      doc.rect(marginX, 10, contentWidth, headerHeight, "F");

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("End of Day Update", marginX + 4, 25);

      if (logoBase64) {
        doc.addImage(
          logoBase64,
          "PNG",
          marginX + contentWidth - 25,
          12,
          20,
          20
        );
      }
    };

    // === FOOTER DRAW FUNCTION ===
    const drawFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }
    };

    // === FIRST PAGE HEADER ===
    drawHeader();

    // === EXPENSE BOX ===
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0);

    const infoLines = [];
    if (summary.allTasksNum !== undefined)
      infoLines.push(`TOTAL TASKS: ${summary.allTasksNum}`);
    if (options.includeAdvance && summary.budgertLeft !== undefined)
      infoLines.push(`LEFT ADVANCE AMOUNT: ${summary.budgertLeft.toFixed(2)}`);
    if (summary.todaysExpense !== undefined)
      infoLines.push(`EXPENSES TODAY: ${summary.todaysExpense}`);
    if (summary.mtdExpense !== undefined)
      infoLines.push(`EXPENSES MTD: ${summary.mtdExpense}`);

    const expenseBoxTop = 10 + headerHeight; // Directly below header
    const expenseBoxHeight = 6 + infoLines.length * 5; // Smaller box

    doc.rect(marginX, expenseBoxTop, contentWidth, expenseBoxHeight);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EXPENSE INFORMATION:", marginX + 4, expenseBoxTop + 10);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    infoLines.forEach((line, i) => {
      doc.text(line, marginX + 120, expenseBoxTop + 6 + i * 5); // Left aligned
    });

    let nextY = expenseBoxTop + expenseBoxHeight + 4;

    // === TASKS TABLE ===
    if (options.includeTasks && tasks.length > 0) {
      const formatDate = (date) => {
        if (!date) return "—";
        let d;
        if (date.toDate) d = date.toDate();
        else if (date instanceof Date) d = date;
        else if (typeof date === "string") d = new Date(date);
        if (!d || isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d);
      };

      const taskTable = tasks.map((t, i) => [
        i + 1,
        t?.taskType === "OTS" || t?.taskType === "Associate"
          ? `Request raised for - ${t?.taskCategory || "Unknown"}`
          : t?.taskSubject && t.taskSubject.trim() !== ""
          ? t.taskSubject
          : "Unnamed Task",
        t?.lastComment || "—",
        t?.taskStatusCategory || "—",
        formatDate(t?.taskDueDate),
      ]);

      autoTable(doc, {
        startY: nextY,
        margin: {
          top: 10 + headerHeight + 5,
          left: marginX,
          right: marginX,
        },
        head: [["S.No", "Details", "Update", "Current Status", "Due Date"]],
        body: taskTable,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          1: { halign: "left", cellWidth: 70 },
          2: { halign: "left", cellWidth: 35 },
          3: { halign: "center", cellWidth: 40 },
          4: { halign: "center", cellWidth: 30 },
        },
        didDrawPage: () => {
          drawHeader();
        },
      });

      nextY = doc.lastAutoTable.finalY + 5;
    }

    // === INVOICES TABLE ===
    if (options.includeInvoices && invoices.length > 0) {
      const invoiceTable = invoices.map((inv, i) => [
        i + 1,
        inv.invoiceId || "—",
        inv.amount || "—",
        inv.status || "—",
        new Date(inv.date).toLocaleDateString("en-GB"),
      ]);

      autoTable(doc, {
        startY: nextY,
        margin: {
          top: 10 + headerHeight + 5,
          left: marginX,
          right: marginX,
        },
        head: [["S.No", "Invoice ID", "Amount", "Status", "Date"]],
        body: invoiceTable,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          1: { halign: "left", cellWidth: 55 },
          2: { halign: "right", cellWidth: 35 },
          3: { halign: "center", cellWidth: 40 },
          4: { halign: "center", cellWidth: 35 },
        },
        didDrawPage: () => {
          drawHeader();
        },
      });
    }

    // === FOOTER ===
    drawFooter();

    // === SAVE PDF ===
    const todayFile = new Date().toISOString().slice(0, 10);
    const fileSafeName =
      patron?.patronName?.replace?.(/[^\w\-]+/g, "_") || "Patron";
    doc.save(`EOD_${fileSafeName}_${todayFile}.pdf`);
  };

  return { generateEODReport };
}
