"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import ExpenseLongForm from "../../../components/utils/ExpenseLongForm";
import { useParams } from "next/navigation";
import { useAuth } from "../../../app/context/AuthContext";
import {useGeminiGenerateItemsForItemization}from '../../../components/hooks/useGeminiGenerateItemsForItemization'
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
  const [taskdata, setTaskData] = useState(null);
  const [mainNewApprovalManagementData, setmainNewApprovalManagementData] =
    useState(null);
  const [
    d2cApprovalExpenseSubCategoryData,
    setd2cApprovalExpenseSubCategoryData,
  ] = useState([]);
  const [showItemizationTable, setShowItemizationTable] = useState(false);
  const {generateItemsForItemization } = useGeminiGenerateItemsForItemization(gapi);

  

  const sendingFormData = useMemo(() => {
    if (!invoiceData) return {};

    const pdfText = invoiceData?.pdfText ?? "";
    const base64 = invoiceData?.base64 ?? "";
    const cashMemoRef = invoiceData?.cashMemoRef ?? "";

    const formatDate = (ts) => {
      if (!ts) return "";
      try {
        const date =
          typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
        return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
      } catch {
        return "";
      }
    };

    if (cashMemoRef !== "") {
      return {
        invoiceNumber: invoiceData.invoiceNumber,
        cashMemoItems: cashMemoData?.items || [],
        vendorName: invoiceData.vendorName || "n/a",
        approvalId: invoiceData.approvalId || "",
        approvalExpenseSubCategory: invoiceData.billingModel || "",
        paymentMode: invoiceData.paymentMode || "",
        invoiceDate: formatDate(invoiceData.invoiceDate) || "",
        expenseDescription: invoiceData.invoiceDescription || "",
      };
    } else {
      let itemozationText = "";
      if (pdfText !== "") {
        itemozationText = pdfText;
      } else if (base64 !== "") {
        itemozationText = base64;
      }
      return {
        invoiceNumber: invoiceData.invoiceNumber,
        itemozationText,
        vendorName: invoiceData.vendorName || "n/a",
        approvalId: invoiceData.approvalId || "",
        approvalExpenseSubCategory: invoiceData.billingModel || "",
        paymentMode: invoiceData.paymentMode || "",
        invoiceDate: formatDate(invoiceData.invoiceDate) || "",
        expenseDescription: invoiceData.invoiceDescription || "",
      };
    }
  }, [invoiceData, cashMemoData]);

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
  console.log(invoiceData,"invoice")

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

  const handleFormSubmit = async(data) => {
    try {
      let d2cFields = {};
      let itemizedDataFields = {};

      const filteritem = d2cApprovalExpenseSubCategoryData.find(
        (doc) => doc.subCategoryName === data.approvalExpenseSubCategory
      );

      if (data?.isCashMemo == true) {
        itemizedDataFields = {
          isItemized: true, //cashRef that true // in palce of invice image/pdf it is false
          itemizationStatus: "Completed", //when it itimized Itemized /cash men=mo Completed
        };
      } else if (data?.isCashMemo == false) {
        itemizedDataFields = {
          isItemized: false, //cashRef that true // in palce of invice image/pdf it is false
          itemizationStatus: "Pending", //when it itimized Itemized /cash men=mo Completed
        };
      }

      if (filteritem) {
        d2cFields = {
          approvalExpenseSubCategory: data.approvalExpenseSubCategory,
          approvalExpenseCategory: filteritem.categoryName,
          approvalExpenseFlagCode: filteritem.approvalExpenseFlagCode,
        };
      }

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
        noServicableMonths: "", //currnet moth pnl moth delfalt 1
        monthOfExpense: "", //pnl month forndata
        expenseMonthString: "", //pnl moth string from data
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
        patronEmail: "", //patron.email

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
      console.log("final", {
        ...formFields,
        ...basicFields,
        ...d2cFields,
        ...itemizedDataFields,
      });
      console.log("submitted");
      if (data?.isCashMemo == false) {
        const itemsdatareponse= await generateItemsForItemization(invoiceData.base64 || invoiceData.pdfText)
        console.log("response",itemsdatareponse)
        setItems(itemsdatareponse?.items)
        setShowItemizationTable(true);
      } else {
        setShowItemizationTable(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

const  handleItemization =(itemizationtabledata)=>{
      console.log("parent",itemizationtabledata)
}

  if (loading) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Expense Form</h1>

      <ExpenseLongForm
        onSubmit={handleFormSubmit}
        initialData={sendingFormData}
      />

      {showItemizationTable && (
        <div ref={tableRef} className="mt-6">
          <ItemizationTable items={items}  onSubmit={handleItemization}/>
        </div>
      )}
    </div>
  );
};

export default Page;
