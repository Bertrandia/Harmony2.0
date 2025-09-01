"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import ExpenseLongForm from "../../../components/utils/ExpenseLongForm";
import { useParams } from "next/navigation";
import { useAuth } from "../../../app/context/AuthContext";
import { useGeminiGenerateItemsForItemization } from "../../../components/hooks/useGeminiGenerateItemsForItemization";
import { gapi } from "../../../components/constants";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import ItemizationTable from "../../../components/utils/ItemizationTable";

const Page = () => {
  const tableRef = useRef(null);
  const { invoiceid } = useParams();
  const { userDetails } = useAuth();
  const [invoiceData, setInvoiceData] = useState(null);
  const [cashMemoData, setCashMemoData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ailoading, setaiLoading] = useState(true);
  const [taskdata, setTaskData] = useState(null);
  const [patrondata, setPatrondata] = useState([]);
  const [sendingFormData, setSendingFormData] = useState(null);
  const [mainNewApprovalManagementData, setmainNewApprovalManagementData] =
    useState(null);
  const [
    d2cApprovalExpenseSubCategoryData,
    setd2cApprovalExpenseSubCategoryData,
  ] = useState([]);
  const [showItemizationTable, setShowItemizationTable] = useState(false);
  const { generateItemsForItemization } =
    useGeminiGenerateItemsForItemization(gapi);

 

  useEffect(() => {
    if (!invoiceData) return;

    const formatDate = (ts) => {
      if (!ts) return "";
      try {
        const date =
          typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
        return date.toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    const prepareData = async () => {
      setaiLoading(true); // mark loading start
      let formData = {};

      if (invoiceData.cashMemoRef && invoiceData.cashMemoRef !== "") {
        formData = {
          invoiceNumber: invoiceData?.invoiceNumber,
          cashMemoItems: cashMemoData?.items || [],
          invoiceAmount: invoiceData?.invoiceAmount,
          vendorName: invoiceData?.vendorName || "n/a",
          approvalId: invoiceData?.approvalId || "",
          approvalExpenseSubCategory: invoiceData?.billingModel || "",
          paymentMode: invoiceData?.paymentMode || "",
          invoiceDate: formatDate(invoiceData?.invoiceDate) || "",
          expenseDescription: invoiceData?.invoiceDescription || "",
          MbudgetLeft: mainNewApprovalManagementData?.budgetLeft,
          isCashMemoInvoice: true,
        };
      } else {
        let itemozationText = "";
        let airesponse = null;

        if (invoiceData.pdfText && invoiceData.pdfText.trim() !== "") {
          itemozationText = invoiceData.pdfText;
          const itemsdatareponse = await generateItemsForItemization(
            invoiceData.pdfText
          );
          airesponse = itemsdatareponse;
          setItems(itemsdatareponse?.items);
        } else if (invoiceData.base64 && invoiceData.base64.trim() !== "") {
          itemozationText = invoiceData.base64;
          const itemsdatareponse = await generateItemsForItemization(
            invoiceData.base64
          );
          airesponse = itemsdatareponse;
          setItems(itemsdatareponse?.items);
        }

        const toNumber = (val) => {
          if (!val) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        formData = {
          invoiceNumber: invoiceData.invoiceNumber,
          itemozationText,
          vendorName: invoiceData.vendorName || "n/a",
          approvalId: invoiceData.approvalId || "",
          approvalExpenseSubCategory: invoiceData.billingModel || "",
          paymentMode: invoiceData.paymentMode || "",
          invoiceDate: formatDate(invoiceData.invoiceDate) || "",
          expenseDescription: invoiceData.invoiceDescription || "",
          preTaxAmount: toNumber(airesponse?.pretax_amount),
          cgstAmount: toNumber(airesponse?.cgst_amount),
          sgstAmount: toNumber(airesponse?.sgst_amount),
          igstAmount: toNumber(airesponse?.igst_amount),
          otherCharges: toNumber(airesponse?.other_charges),
          totalAmount: toNumber(airesponse?.total_amount),
          aitotalAmount: toNumber(airesponse?.total_amount),
          MbudgetLeft: mainNewApprovalManagementData?.budgetLeft,
        };
      }
        
      setSendingFormData(formData);
      setaiLoading(false); // mark loading done
    };

    prepareData();
  }, [invoiceData, cashMemoData, mainNewApprovalManagementData]);

  function toFirestoreTimestamp(dateValue) {
    if (!dateValue) return null; // handle empty case

    try {
      const jsDate =
        dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(jsDate.getTime())) return null; // invalid date
      return Timestamp.fromDate(jsDate);
    } catch (err) {
      console.error("Invalid date conversion:", dateValue, err);
      return null;
    }
  }
  // console.log(invoiceData, "invoice");
  // console.log(patrondata, "patron");
  // console.log(taskdata, "task");
  // console.log(cashMemoData, "cashmemodata");
  // console.log(mainNewApprovalManagementData, "main");

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceid) return;
      try {
        const docRef = doc(db, "LMInvoices", invoiceid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: invoiceid, ...docSnap.data(), invoiceRef: docRef };
          setInvoiceData(data);

          // ✅ fetch cash memo doc if ref exists & not empty
          if (data.cashMemoRef && data.cashMemoRef !== "") {
            const cashMemoRef = doc(db, "crmCashMemo", data.cashMemoRef?.id);
            const cashMemoSnap = await getDoc(cashMemoRef);

            if (cashMemoSnap.exists()) {
              const cmData = {
                id: data.cashMemoRef?.id,
                ...cashMemoSnap.data(),
              };
              setCashMemoData(cmData);
            }
          }
          if (data.approvalId) {
            const q = query(
              collection(db, "mainNewApprovalManagement"),
              where("ApprovalID", "==", data.approvalId)
            );
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              const approvalDocSnap = querySnap.docs[0]; // first matching doc
              const mainNewApprovalManagement = approvalDocSnap.ref; // DocumentReference
              const mainNewApprovalManagementData1 = approvalDocSnap.data();
              setmainNewApprovalManagementData({
                mainNewApprovalManagementRef: mainNewApprovalManagement,
                ...mainNewApprovalManagementData1,
              });
            } else {
              console.log(
                "❌ No approval doc found for ApprovalID:",
                data.approvalId
              );
            }
          }
          if (data.taskRef) {
            try {
              const taskSnap = await getDoc(data.taskRef); // taskRef is a DocumentReference
              if (taskSnap.exists()) {
                const taskData = { id: taskSnap.id, ...taskSnap.data() };
                setTaskData(taskData);
              } else {
                console.log("❌ No task document found for taskRef");
              }
            } catch (err) {
              console.error("Error fetching task document:", err);
            }
          }
          if (data.patronRef) {
            try {
              const patronSnap = await getDoc(data.patronRef); // taskRef is a DocumentReference
              if (patronSnap.exists()) {
                const patronData = { id: patronSnap.id, ...patronSnap.data() };
                setPatrondata(patronData);
              } else {
                console.log("❌ No task document found for taskRef");
              }
            } catch (err) {
              console.error("Error fetching task document:", err);
            }
          }
        } else {
          console.log("No such invoice document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchd2cApprovalExpenseSubCategory = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "d2cApprovalExpenseSubCategory")
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setd2cApprovalExpenseSubCategoryData(data);
      } catch (error) {
        console.error("Error fetching d2cApprovalExpenseSubCategory:", error);
      }
    };

    fetchd2cApprovalExpenseSubCategory();
    fetchData();
  }, [invoiceid]);

  useEffect(() => {
    if (showItemizationTable && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showItemizationTable]);

  const handleFormSubmit = async (data) => {
    try {
      let d2cFields = {};
      let itemizedDataFields = {
        isItemized: false, //cashRef that true // in palce of invice image/pdf it is false
        itemizationStatus: "Pending",
      };

      const filteritem = d2cApprovalExpenseSubCategoryData.find(
        (doc) => doc.subCategoryName === data.approvalExpenseSubCategory
      );

      if (filteritem) {
        d2cFields = {
          approvalExpenseSubCategory: data.approvalExpenseSubCategory,
          approvalExpenseCategory: filteritem.categoryName,
          approvalExpenseFlagCode: filteritem.approvalExpenseFlagCode,
        };
      }

      const monthOfExpense = data?.pnlMonth
        ? Timestamp.fromDate(new Date(data?.pnlMonth))
        : null;

      const expenseMonthString = data?.pnlMonth
        ? new Date(data?.pnlMonth).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "";

      function makeExpenseUniqueId({
        patronName,
        createDate,
        category,
        subCategory,
        categoryTag,
      }) {
        // patronName: first letter + last 2 letters (uppercase)
        let nameCode =
          patronName && patronName.length >= 3
            ? patronName[0].toUpperCase() + patronName.slice(-2).toUpperCase()
            : patronName.toUpperCase();

        // dateCode: ddMMyy
        const date = new Date(createDate);
        const dateCode = date
          .toLocaleDateString("en-GB") // dd/MM/yyyy
          .split("/")
          .map((part, i) => (i === 2 ? part.slice(2) : part)) // take yy from yyyy
          .join(""); // "ddMMyy"

        // timeCode: HHmmss
        const timeCode =
          String(date.getHours()).padStart(2, "0") +
          String(date.getMinutes()).padStart(2, "0") +
          String(date.getSeconds()).padStart(2, "0");

        // category, subCategory, categoryTag codes
        const categoryCode = category
          ? category.slice(0, 3).toUpperCase()
          : "CAT";
        const subCategoryCode = subCategory
          ? subCategory.slice(0, 3).toUpperCase()
          : "SUB";
        const categoryTagCode = categoryTag
          ? categoryTag.slice(0, 2).toUpperCase()
          : "TG";

        // Build final unique ID
        return `${nameCode}${categoryCode}${dateCode}${timeCode}${subCategoryCode}${categoryTagCode}`;
      }

      function makeItemID({
        itemName,
        category,
        subCategory,
        date,
        patronName,
        invoiceNumber,
      }) {
        // itemName: first 3 chars
        const itemNameCode = itemName
          ? itemName.slice(0, 3).toUpperCase()
          : "ITM";

        // category: first 2 chars
        const categoryCode = category
          ? category.slice(0, 2).toUpperCase()
          : "CA";

        // subCategory: first 3 chars
        const subCategoryCode = subCategory
          ? subCategory.slice(0, 3).toUpperCase()
          : "SUB";

        // dateCode: ddMMyyHHmmss
        const d = new Date(date);
        const pad = (n) => String(n).padStart(2, "0");
        const dateCode =
          pad(d.getDate()) +
          pad(d.getMonth() + 1) +
          String(d.getFullYear()).slice(2) +
          pad(d.getHours()) +
          pad(d.getMinutes()) +
          pad(d.getSeconds());

        // patronName: first 3 chars
        const patronNameCode = patronName
          ? patronName.slice(0, 3).toUpperCase()
          : "PAT";

        // optional: if you want to use invoice number
        const invoiceNumberCode = invoiceNumber
          ? invoiceNumber.slice(0, 3).toUpperCase()
          : "INV";

        // Build final itemID
        return `${itemNameCode}${categoryCode}${subCategoryCode}${dateCode}${patronNameCode}${invoiceNumberCode}`;
      }

      const expenseUniqueId = makeExpenseUniqueId({
        patronName: taskdata.newPatronName || taskdata.patronName,
        createDate: new Date(),
        category: taskdata.taskCategory,
        subCategory: taskdata.taskSubCategory,
        categoryTag: taskdata.categoryTag,
      });

      const formFields = {
        advanceAmountPaid: data?.paidAdvanceAmount,
        approvalID: data?.approvalId || "",
        billingModel: data?.approvalExpenseSubCategory || "",
        cgstAmount: data?.cgstAmount,
        sgstAmount: data?.sgstAmount,
        descriptionOfExpense: data?.expenseDescription,
        dueDateType: data?.dueDateType,
        igstAmount: data?.igstAmount,
        invoiceDate: data?.invoiceDate,
        invoiceDueDate: toFirestoreTimestamp(data?.invoiceDueDate),
        invoiceDueDateString: data?.invoiceDueDate,
        invoiceNumber: data?.invoiceNumber,
        isCompanyGstInInvoie: data?.DropdownGST,
        isCompanyInvoice: data?.DropdownGST,
        isGSTApplicable: data?.isGstApplicable,
        otherCharges: data?.otherCharges,
        paymentMode: data?.paymentMode,
        preTaxAmount: data?.preTaxAmount,
        remarks: data?.remarks,
        totalAmount: data?.totalAmount,
        typeOfExpense: "Billable",
        vendorName: data?.vendorName,
        capex_opex: data?.typeOfExpenditure,
        noServicableMonths: 1, //currnet moth delfalt 1 shoe 12
        monthOfExpense: monthOfExpense, //pnl month forndata fire base date
        expenseMonthString: expenseMonthString, //pnl moth string from data
      };

      const basicFields = {
        aiTaskCategory: taskdata?.aiCreatedCategory || "",
        aiTaskSubCategory: taskdata?.aiCreatedSubCategory || "",
        approvalDescription:
          mainNewApprovalManagementData?.purchaseDescription || "", ///came from main neew approval
        approvalIdDate: mainNewApprovalManagementData?.dateOfApproval || "", //came from main neew approval
        approvalPurchaseType:
          mainNewApprovalManagementData?.typeOfPurchase || "", ///came from main neew approval
        approvalRef:
          mainNewApprovalManagementData?.mainNewApprovalManagementRef || "", //mainnewapplManagenet Ref
        approvalStatus: "Pending",
        assignedByRef: taskdata?.assignedByRef || "",
        assignedLMName: invoiceData?.lmName || "",
        brand: mainNewApprovalManagementData?.newBrand || "", //mainNew Approvaldata
        subBrand: mainNewApprovalManagementData?.newSubBrand || "", //mainNewapplovaldata
        cashMemoRef: invoiceData?.cashMemoRef || "", //cashmemoref
        cashMemoReferencePdf2: cashMemoData?.cashMemoPdf || "", //cashmemdta
        createdAt: Timestamp.now(),
        crmTaskId: taskdata?.taskID || "",
        customerName: invoiceData?.newpatronName || "",
        email: mainNewApprovalManagementData?.empEmail || "", //lm email
        employeeRef: mainNewApprovalManagementData?.employeRef || "", //lmRef
        expenseCategory: taskdata?.taskCategory || "", //taskcategoty
        expenseCategoryTag: taskdata?.categoryTag || "", //taskcategorytag
        expenseFinalApprovalforGSheet: "",
        expenseUniqueId: invoiceData?.uniqueExpenseId,
        finanaceExpenseUpdateStatusTimeInString: "",
        geminiCheck: false,
        imageUrl: invoiceData?.invoice || "", //invoicedata.imageurl if prenet
        invoicePdf: invoiceData?.invoice || "", // invoiceUrl
        isCashMemoApplied: false,
        isTaskDisabled: taskdata?.isTaskDisabled || false, //task.istaskDisbled
        isUsed: false,
        l1Approved: false,
        l2Approved: false,
        l3Approved: false,
        lmApprovalRef: invoiceData?.approvalRef || "", //invovei advance ApprovalFinece came from lmInvoice
        lmInvoiceAddedAt: invoiceData?.createdAt || "",
        lmInvoiceAddedBy: invoiceData?.createdBy || "",
        lmRef: invoiceData?.lmRef || "",
        location: mainNewApprovalManagementData?.location || "", ///mainNewapprovaldata
        name: mainNewApprovalManagementData?.empName || "", //lm name
        newPatronID: invoiceData?.newPatronID || "",
        newPatronName: invoiceData?.newPatronName || "",
        patronID: invoiceData?.patronID || "",
        patronRef: invoiceData?.patronRef || "",
        rmApproved: "Pending",
        rmRef: mainNewApprovalManagementData?.reportingManagerRef || "", //lm reporting manager
        lmInvoiceRef: invoiceData?.invoiceRef || "", //inviocedataRef
        createdBy: userDetails?.email || "", //userDetails email
        patronEmail: patrondata?.email || "", //patron.email
        taskAssignDate: taskdata?.taskAssignDate || "",
        taskAssignedBy: taskdata?.taskAssignedBy || "",
        taskCoOwner: taskdata?.coOwnerName || "",
        taskDate: taskdata?.createdAt || "",
        taskDescription: taskdata?.taskDescription || "",
        taskDisablingReason: taskdata?.taskDisablingReason || "",
        taskDueDate: taskdata?.taskDueDate || "",
        taskID: taskdata?.taskID || "",
        taskName: taskdata?.taskSubject || "",
        taskOwner: taskdata?.taskOwner || "",
        taskPriority: taskdata?.priority || "",
        taskRef: invoiceData.taskRef || "",
        taskSubject: taskdata?.taskSubject || "",
        timeStamp: Timestamp.now(),
        timeStampInString: Timestamp.now().toDate().toISOString(),

        reasonOfRejection: "", //e
        rejectedBy: "", //e
        dateInString: "", //empty
        approvedBy: "", //empty
      };

      console.log(
        "final",
        {
          ...formFields,
          ...basicFields,
          ...d2cFields,
          ...itemizedDataFields,
        },
        "submited"
      );

      if (data?.isCashMemo == true) {
        const defaultItemSchema = {
          aiTaskCategory: taskdata?.aiCreatedCategory || "",
          aiTaskCategoryTag: "",
          aiTaskSubCategory: taskdata?.aiCreatedSubCategory || "",
          approvalAmount: "",
          approvalDescription:
            mainNewApprovalManagementData?.purchaseDescription || "",
          approvalExpenseCategory: data?.approvalExpenseCategory || "",
          approvalExpenseFlagCode: filteritem?.approvalExpenseFlagCode || "",
          approvalExpenseSubCategory: data?.approvalExpenseSubCategory || "",
          approvalID: data?.approvalId || "",
          approvalIdDate: mainNewApprovalManagementData?.dateOfApproval || "",
          approvalRef:
            mainNewApprovalManagementData?.mainNewApprovalManagementRef || "",
          approvalTypeOfService: "",
          assignedByRef: taskdata?.assignedByRef || "",
          assignedLMName: invoiceData?.lmName || "",
          backUpLmName: patrondata.backupLmName || "",
          backUpLmRef: patrondata.backupLmRef || "",
          billCategory: "",
          billingModel: data?.approvalExpenseSubCategory || "",
          brand: mainNewApprovalManagementData?.newBrand || "",
          capexOpex: data?.typeOfExpenditure || "",
          categoryTag: taskdata?.categoryTag || "",
          cessAmount: "0.00",
          createdAt: Timestamp.now() || "",
          createdBy: userDetails?.email || "",
          dueDateType: data?.dueDateType || "",
          employeeRef: mainNewApprovalManagementData?.employeRef || "",
          expenseAmount: data?.totalAmount || "",
          expenseCategory: taskdata?.taskCategory || "",
          expenseCategoryTag: taskdata?.categoryTag || "",
          expenseDescription: data?.expenseDescription || "",
          expenseID: invoiceData?.uniqueExpenseId || "",
          expenseMonth: "" || "", // pnl month – from data if available
          expenseRef: invoiceData?.invoiceRef || "",
          expenseSubCategory: data?.approvalExpenseSubCategory || "",
          financeApproved: "",
          gstAmount: "",
          hsn_snc: "",
          individualItems: "",
          invoiceDate: data?.invoiceDate || "",
          invoiceDueDate: data?.invoiceDueDate || "",
          invoiceImage: invoiceData?.invoice || "",
          invoiceNumber: data?.invoiceNumber || "",
          invoicePdf: invoiceData?.invoice || "",
          isAdminRejected: false,
          isCompanyGstInInvoice: data?.DropdownGST || "",
          isCompanyInvoice: data?.DropdownGST || "",
          isGSTApplicable: data?.isGstApplicable || "",
          isSaved: false,
          isTaskDisabled: taskdata?.isTaskDisabled || false,
          itemCategory: "",
          itemCgst: data?.cgstAmount || "0.00",
          itemCgstRate: "",
          itemID: "",
          itemIgst: data?.igstAmount || "0.00",
          itemIgstRate: "",
          itemNameWithCategory: "",
          itemPrice: "0.00",
          itemSgst: data?.sgstAmount || "0.00",
          itemSgstRate: "",
          itemSubCategory: "",
          lmApprovalRef: invoiceData?.approvalRef || "",
          lmInvoiceAddedAt: invoiceData?.createdAt || "",
          lmInvoiceAddedBy: invoiceData?.createdBy || "",
          lmInvoiceRef: invoiceData?.invoiceRef || "",
          lmName: invoiceData?.lmName || "",
          lmNumber: "",
          lmRef: invoiceData?.lmRef || "",
          location: mainNewApprovalManagementData?.location || "",
          merchantName: data?.vendorName || "",
          newInvoiceImage: "",
          newPatronID: invoiceData?.newPatronID || "",
          newPatronName: invoiceData?.newPatronName || "",
          nmsApproved: "",
          noServicableMonths: "" || "", ///came from data
          paidEmployeeName: "",
          patronEmail: "", // patron.email if available
          patronID: invoiceData?.patronID || "",
          patronName: invoiceData?.newPatronName || "",
          patronRef: invoiceData?.patronRef || "",
          paymentMode: data?.paymentMode || "",
          postReportingManager: "",
          reportingManager:
            mainNewApprovalManagementData?.reportingManagerRef || "",
          rmApproved: "Pending",
          subBrand: mainNewApprovalManagementData?.newSubBrand || "",
          taskAssignDate: taskdata?.taskAssignDate || "",
          taskAssignedBy: taskdata?.taskAssignedBy || "",
          taskCoOwner: taskdata?.coOwnerName || "",
          taskCreatedAt: taskdata?.createdAt || "",
          taskCreatedBy: "",
          taskDate: taskdata?.createdAt || "",
          taskDescription: taskdata?.taskDescription || "",
          taskDisablingReason: taskdata?.taskDisablingReason || "",
          taskID: taskdata?.taskID || "",
          taskName: taskdata?.taskSubject || "",
          taskOwner: taskdata?.taskOwner || "",
          taskPriority: taskdata?.priority || "",
          taskSubject: taskdata?.taskSubject || "",
          typeOfExpense: "Billable",
          vendorName: data?.vendorName || "",
        };

        cashMemoData?.items.map((item) => {
          const itemID = makeItemID({
            itemName: item.itemName || "",
            category: d2cFields?.approvalExpenseCategory || "",
            subCategory: d2cFields?.approvalExpenseSubCategory || "",
            date: new Date(),
            patronName: taskdata.newPatronName || taskdata.patronName || "",
            invoiceNumber: invoiceData?.invoiceNumber || "",
          });
          console.log("item", {
            ...defaultItemSchema,
            ...item,
            ...{ itemID: itemID },
          });
        });

        itemizedDataFields = {
          isItemized: true,
          itemizationStatus: "Completed",
        };

        console.log("update", itemizedDataFields);
      } else if (data?.isCashMemo == false) {
        itemizedDataFields = {
          isItemized: false, //cashRef that true // in palce of invice image/pdf it is false
          itemizationStatus: "Pending", //when it itimized Itemized /cash men=mo Completed
        };
      }

      if (data?.isCashMemo == false) {
        setShowItemizationTable(true);
      } else {
        setShowItemizationTable(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleItemization = (itemizationtabledata) => {
    console.log("parent", itemizationtabledata);
  };

  if (loading) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Expense Form</h1>

      {ailoading ? (
        <p className="text-gray-500">Preparing invoice form...</p>
      ) : (
        <ExpenseLongForm
          onSubmit={handleFormSubmit}
          initialData={sendingFormData}
        />
      )}

      {showItemizationTable && (
        <div ref={tableRef} className="mt-6">
          <ItemizationTable items={items} onSubmit={handleItemization} />
        </div>
      )}
    </div>
  );
};

export default Page;
