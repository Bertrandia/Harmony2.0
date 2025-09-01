"use client";

import { useContext, useEffect, useState, useRef } from "react";
import {
  Search,
  MessageCircle,
  Bot,
  User,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Mic,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  Timestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { LMPatronContext } from "../context/LmPatronsContext";
import { db } from "@/firebasedata/config";
import { useAuth } from "../../app/context/AuthContext";
import { gapi } from "../../components/constants";
import { useGeminiGenerateTask } from "../../components/hooks/useGeminiGenerateTask";
import GeneratedTaskFormModal from "@/components/utils/GeneratedTaskFormModal";
import FullPageLoader from "@/components/utils/FullPageLoader";
import { format } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ChatInterface() {
  const router = useRouter();
  const storage = getStorage();
  const { lmpatrons } = useContext(LMPatronContext);
  const { userDetails } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [chatMode, setChatMode] = useState("hybrid"); // 'hybrid' or 'support'
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [HybridAndLmMessages, setHybridAndLmMessages] = useState([]);
  const { isLoading, aiTasks, error, generateTasks } =
    useGeminiGenerateTask(gapi);
  const [showModal, setShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);
  const [currentmessegeData, setCurrentMessageData] = useState(null);
  const [activeMessageActions, setActiveMessageActions] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({ behavior: "auto" });
  }, [HybridAndLmMessages, chatMode]);

  const selectedCustomer = lmpatrons.find((c) => c.id === selectedCustomerId);

  useEffect(() => {
    if (!selectedCustomer) return;

    const conversationId = selectedCustomer?.id;
    if (!conversationId) return;

    let unsubscribe = () => {};

    try {
      if (chatMode === "hybrid") {
        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages"
        );

        const messagesQuery = query(
          messagesRef,
          where("isHybrid", "==", true),
          orderBy("timestamp", "desc")
        );

        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messages = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .reverse();

          setHybridAndLmMessages(messages); // 👈 Your state setter for hybrid messages
        });
      } else if (chatMode === "support") {
        const supportMessagesRef = collection(
          db,
          "addPatronDetails",
          conversationId,
          "messages"
        );

        const supportMessagesQuery = query(
          supportMessagesRef,
          orderBy("timestamp", "desc")
        );

        unsubscribe = onSnapshot(supportMessagesQuery, (snapshot) => {
          const messages = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .reverse();

          setHybridAndLmMessages(messages);
        });
      }
    } catch (error) {
      console.log("Error fetching messages:", error.message);
    }

    return () => unsubscribe();
  }, [selectedCustomer, chatMode]);

  const filteredCustomers = (lmpatrons || []).filter((patron) =>
    patron?.patronName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getFileNameFromUrl = (url) => {
    try {
      return decodeURIComponent(url.split("/").pop() || "Document");
    } catch {
      return "Document";
    }
  };

  const isMessageFromUser = (message) =>
    message.message_type === "user_input" || message.senderType === "patron";

  function generateTaskId(taskCategory, patronName, subCategory) {
    // --- Patron Name Code ---
    let nameCode = "";
    if (patronName) {
      nameCode =
        patronName.length >= 3
          ? patronName[0].toUpperCase() + patronName.slice(-2).toUpperCase()
          : patronName.toUpperCase();
    }

    // --- Task Category Code ---
    let categoryCode = "UNK";
    if (taskCategory) {
      categoryCode =
        taskCategory.length >= 3
          ? taskCategory.substring(0, 3).toUpperCase()
          : taskCategory.toUpperCase();
    }

    // --- Subcategory Code ---
    let subCategoryCode = "";
    if (subCategory) {
      subCategoryCode =
        subCategory.length >= 2
          ? subCategory.substring(0, 2).toUpperCase()
          : subCategory.toUpperCase();
    }

    // --- Date & Time Codes ---
    const dateCode = format(new Date(), "ddMMyy");
    const timeCode = format(new Date(), "HHmmss");

    // --- Final Task ID ---
    const taskId = `${nameCode}${categoryCode}${dateCode}${timeCode}${subCategoryCode}`;
    return taskId;
  }

  const getInitials = (name = "") => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0]?.toUpperCase();
    return (words[0][0] + words[1][0])?.toUpperCase();
  };

  const handleCreateTask = async (messagedata) => {
    const generated = await generateTasks(
      messagedata.content || messagedata.text
    );

    if (generated && generated.length > 0) {
      setAiTaskQueue(generated);
      setShowModal(true);

      return;
    } else {
      // setWarningMessage("No tasks generated by AI");
      // setShowWarning(true);
      alert(
        "No tasks generated. Task input is missing or invalid. Please provide proper input to generate tasks."
      );
      return;
    }
  };

  const toggleMessageActions = (messageId) => {
    setActiveMessageActions(
      activeMessageActions === messageId ? null : messageId
    );
  };

  const handleCancelTask = async (messagedata) => {
    console.log(messagedata);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return; // block empty message
    if (!selectedCustomer) return;

    setIsSending(true); // disable send button immediately

    const conversationId = selectedCustomer?.id;
    const lmref = doc(db, "user", userDetails.id);
    if (!conversationId) {
      setIsSending(false);
      return;
    }

    let imageUrl = "";
    let docUrl = "";
    let fileName = "";

    if (selectedFile && chatMode === "support") {
      try {
        fileName = selectedFile.name;
        const storageRef = ref(storage, `chatFiles/${fileName}`);
        await uploadBytes(storageRef, selectedFile);
        const downloadUrl = await getDownloadURL(storageRef);

        if (selectedFile.type === "application/pdf") {
          docUrl = downloadUrl;
        } else if (selectedFile.type.startsWith("image/")) {
          imageUrl = downloadUrl;
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setIsSending(false);
        return;
      }
    }

    try {
      if (chatMode === "hybrid") {
        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages"
        );

        const newDoc = {
          message_type: "Lm_input",
          role: "LM",
          timestamp: Timestamp.now(),
          order: Timestamp.now(),
          lmName: userDetails?.display_name,
          lmRef: lmref,
          isHybrid: true,
          isWhatsApp: false,
          lmID: userDetails.id,
          content: newMessage,
        };

        await addDoc(messagesRef, newDoc);
      } else if (chatMode === "support") {
        const patronref = doc(db, "addPatronDetails", conversationId);
        const supportMessagesRef = collection(
          db,
          "addPatronDetails",
          conversationId,
          "messages"
        );

        const newDoc = {
          text: newMessage,
          senderName: userDetails?.display_name || "",
          timestamp: Timestamp.now(),
          isFromPatron: false,
          patronRef: patronref,
          senderType: "LM",
          type: "text",
          senderId: userDetails.id,
          status: "sent",
          imageUrl: imageUrl,
          docUrl: docUrl,
          fileName: fileName,
        };

        await addDoc(supportMessagesRef, newDoc);
      }

      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false); // re-enable send button
    }
  };

  function renderMessageText(text) {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }

  const handelGenerateTaskCancel = () => {
    setShowModal(false);
    setAiTaskQueue([]);
    setCurrentMessageData(null);
  };

  const handelGenerateTaskSubmit = async (
    formData,
    index,
    setSubmissionStatus,
    markFirstSubmitted
  ) => {
    try {
      const patrondata = selectedCustomer;
      const messageData = currentmessegeData; // renamed for clarity

      // Guard: Required fields check
      if (
        !patrondata?.id ||
        !formData?.taskCategory ||
        !formData?.taskSubCategory
      ) {
        throw new Error("Missing required fields for task creation.");
      }

      // Guard: userDetails check
      if (
        !userDetails?.id ||
        !userDetails?.email ||
        !userDetails?.display_name
      ) {
        throw new Error("Missing required user details for task creation.");
      }

      const taskId = generateTaskId(
        formData.taskCategory,
        patrondata.newPatronName,
        formData.taskSubCategory
      );

      const patronRef = doc(db, "addPatronDetails", patrondata.id);
      const lmRef = doc(db, "user", userDetails.id);

      const fullAddress = [
        patrondata?.addressLine1,
        patrondata?.addressLine2,
        patrondata?.landmark,
        patrondata?.city,
        patrondata?.state,
        patrondata?.pinCode,
      ]
        .filter(Boolean)
        .join(", ");

      const baseTaskFields = {
        backupLmRef: patrondata?.backupLmRef || "",
        backupLmName: patrondata?.backupLmName || "",
        isAdminApproved: false,
        isCockpitTaskCreated: false,
        isCreatedBySpecialLM: false,
        isCuratorTask: false,
        isDelayed: false,
        lastComment: "To be Started",
        newPatronID: patrondata?.newPatronID || "",
        newPatronName: patrondata?.newPatronName || "",
        patronAddress: fullAddress,
        patronCity: patrondata?.city || "",
        taskOwner: userDetails.display_name,
        billingModel: "Billable",
        taskID: taskId,
        tobeStartedAt: Timestamp.now(),
        tobeStartedBy: userDetails.email,
        assignedLmName: patrondata?.assignedLM || "",
        createdAt: Timestamp.now(),
        createdBy: userDetails.email,
        createdById: userDetails.id,
        isTasDisabled: false,
        lmRef: lmRef,
        patronName: patrondata?.newPatronName || patrondata?.patronName || "",
        patronID: patrondata.id,
        patronRef: patronRef,
        taskAssignDate: Timestamp.now(),
        taskInput: messageData?.content || messageData?.text || "",
      };

      const enrichedFormData = {
        ...baseTaskFields,
        ...formData,
      };

      const docRef = await addDoc(
        collection(db, "createTaskCollection"),
        enrichedFormData
      );

      if (index === 0) {
        const updatedMessageData = {
          isTaskCreated: true,
          taskId: docRef.id,
          taskCreatedAt: Timestamp.now(),
          taskStatus: formData.taskStatusCategory,
          taskDescription: formData.taskDescription,
          taskSubject: formData.taskSubject,
          taskType: "general",
          type: "task",
        };

        const conversationId = patrondata?.id;
        const messageId = messageData?.id;

        if (conversationId && messageId) {
          let messageDocRef = null;

          if (chatMode === "hybrid") {
            messageDocRef = doc(
              db,
              "conversations",
              conversationId,
              "messages",
              messageId
            );
          } else if (chatMode === "support") {
            messageDocRef = doc(
              db,
              "addPatronDetails",
              conversationId,
              "messages",
              messageId
            );
          }

          if (messageDocRef) {
            await updateDoc(messageDocRef, updatedMessageData);
          } else {
            console.warn(
              "No valid messageDocRef found for chat mode:",
              chatMode
            );
          }
        }

        setSubmissionStatus((prev) => ({
          ...prev,
          [index]: "success",
        }));

        markFirstSubmitted?.();
      } else {
        setSubmissionStatus((prev) => ({
          ...prev,
          [index]: "success",
        }));
      }
    } catch (error) {
      console.error("Error in form submission:", error?.message || error);
      setSubmissionStatus((prev) => ({
        ...prev,
        [index]: "error",
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {isLoading && <FullPageLoader />}
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
            <button
              onClick={() => setChatMode("hybrid")}
              className={cn(
                "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all",
                chatMode === "hybrid"
                  ? "bg-gray-800 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Bot className="w-4 h-4 mr-2" />
              Hybrid
            </button>
            <button
              onClick={() => setChatMode("support")}
              className={cn(
                "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all",
                chatMode === "support"
                  ? "bg-gray-800 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <User className="w-4 h-4 mr-2" />
              Patron
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search Patrons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomerId(customer.id)}
              className={cn(
                "flex items-center p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors",
                selectedCustomer?.id === customer.id &&
                  "bg-blue-50 border-blue-200"
              )}
            >
              <div className="relative">
                <img
                  src={
                    customer.avatar ||
                    "https://img.freepik.com/premium-vector/young-man-avatar-character_24877-9475.jpg?semt=ais_hybrid&w=740&q=80"
                  }
                  alt={customer.patronName || "dp"}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {customer.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {customer.newPatronName || customer.patronName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {customer.timestamp}
                  </span>
                </div>
              </div>
              {customer.unread > 0 && (
                <div className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {customer.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedCustomer ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={selectedCustomer.photo_url || ""}
                  alt={getInitials(selectedCustomer.patronName)}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedCustomer.name || selectedCustomer.patronName}
                  </h2>
                  <p className="text-sm text-green-500">
                    {chatMode === "hybrid" ? "Hybrid-Chat" : "Patron+LM-Chat"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {HybridAndLmMessages.length === 0 ? (
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="text-center text-gray-500 mt-10">
                    Start a conversation with the {selectedCustomer?.patronName}
                    .
                  </div>
                </div>
              ) : (
                HybridAndLmMessages.map((message) => {
                  const isUser = isMessageFromUser(message);
                  const isTaskCreated = message.isTaskCreated === true;
                  const showActions = activeMessageActions === message.id;

                  const getRightDP = () => {
                    if (message.message_type === "ai_response") return "AI";
                    return getInitials(
                      message.lmName || message.senderName || "U"
                    );
                  };

                  const leftDP = getInitials(
                    selectedCustomer?.patronName ||
                      selectedCustomer?.name ||
                      "P"
                  );

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start gap-2 relative group",
                        isUser ? "justify-start" : "justify-end"
                      )}
                    >
                      {/* Avatar */}
                      {isUser ? (
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-orange-700 text-xs font-bold">
                          {leftDP}
                        </div>
                      ) : (
                        <div className="order-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-orange-700 text-xs font-bold">
                          {getRightDP()}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "flex flex-col",
                          isUser ? "items-start" : "items-end"
                        )}
                      >
                        {!isTaskCreated ? (
                          <div
                            className={cn(
                              "max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm relative",
                              isUser
                                ? "bg-white text-gray-900"
                                : "bg-blue-300 text-gray-900"
                            )}
                          >
                            {/* Render Image if imageUrl exists */}
                            {message.imageUrl && (
                              <img
                                src={message?.imageUrl}
                                alt="attached"
                                className="mb-2 max-w-xs lg:max-w-sm rounded-md object-cover cursor-pointer transition-transform hover:scale-105"
                                onClick={() =>
                                  setPreviewImage(message.imageUrl)
                                }
                              />
                            )}

                            {/* Render Document Preview/Link if docUrl exists */}
                            {message.docUrl && (
                              <a
                                href={message.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-2 w-64 block bg-white border border-gray-300 rounded-lg shadow-sm p-3 flex items-center gap-3 hover:bg-gray-50 transition"
                              >
                                {/* Icon or Thumbnail */}
                                <div className="bg-gray-200 p-2 rounded-md">
                                  <FileText className="w-6 h-6 text-gray-500" />
                                </div>

                                {/* File Name and Info */}
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-gray-800">
                                    <p>{message.fileName}</p>
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Tap to view
                                  </span>
                                </div>
                              </a>
                            )}

                            {/* Message Text */}
                            {(message.content || message.text) && (
                              <p className="text-sm">
                                {renderMessageText(
                                  message.content || message.text
                                )}
                              </p>
                            )}

                            <p
                              className={cn(
                                "text-xs mt-1",
                                isUser ? "text-gray-500" : "text-white/80"
                              )}
                            >
                              {message.timestamp?.toDate
                                ? message.timestamp.toDate().toLocaleString()
                                : ""}
                            </p>

                            {/* Three dots button */}
                            <button
                              onClick={() => {
                                toggleMessageActions(message.id);
                              }}
                              className={cn(
                                "absolute -top-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-300 transition-colors opacity-0 group-hover:opacity-100",
                                isUser ? "-right-8" : "-left-8"
                              )}
                            >
                              <MoreVertical></MoreVertical>
                            </button>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "max-w-xs lg:max-w-md p-4 rounded-lg shadow-md space-y-2 relative",
                              isUser
                                ? "bg-green-100 text-gray-800"
                                : "bg-indigo-100 text-gray-800"
                            )}
                          >
                            <div className="font-semibold text-sm">
                              📌 Task Created
                            </div>
                            <p className="text-sm">
                              {renderMessageText(
                                message.content || message.text
                              )}
                            </p>

                            <button
                              onClick={() => {
                                if (message?.taskId) {
                                  router.push(
                                    `/taskfulldetails/${message.taskId}`
                                  );
                                } else {
                                  console.warn("No taskId in message");
                                }
                              }}
                              className="text-xs px-3 py-1 rounded-md  opacity-70 bg-blue text-blue-700 cursor-pointer hover:bg-slate-900"
                            >
                              taskdetails
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                              {message.timestamp?.toDate
                                ? message.timestamp.toDate().toLocaleString()
                                : ""}
                            </p>

                            {/* Three dots button */}
                            <button
                              onClick={() => {
                                toggleMessageActions(message.id);
                              }}
                              className={cn(
                                "absolute -top-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-300 transition-colors opacity-0 group-hover:opacity-100",
                                isUser ? "-right-8" : "-left-8"
                              )}
                            >
                              <MoreVertical></MoreVertical>
                            </button>
                          </div>
                        )}

                        {/* Action Buttons (shown when three dots clicked) */}
                        {showActions && (
                          <div
                            className={cn(
                              "flex gap-1 mt-2 p-2 bg-white rounded-lg shadow-lg border animate-in slide-in-from-top-2 duration-200",
                              isUser ? "flex-row" : "flex-row-reverse"
                            )}
                          >
                          

                            {isTaskCreated ? (
                              <button
                                onClick={() => handleCancelTask(message)}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                              >
                                {/* <Minus className="w-3 h-3" /> */}
                                Cancel Task
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCurrentMessageData(message);
                                  handleCreateTask(message);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                              >
                                {/* <Plus className="w-3 h-3" /> */}
                                Create Task
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setCurrentMessageData(null);
                                setActiveMessageActions(null);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-900 transition-colors"
                            >
                              {/* <X className="w-3 h-3" /> */}X
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* ✅ Auto scroll ref */}
              <div ref={messagesEndRef} />
            </div>

            {previewImage && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 text-white text-3xl font-bold z-50 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80"
                  onClick={() => setPreviewImage(null)}
                >
                  ✕
                </button>

                {/* Image */}
                <img
                  src={previewImage}
                  alt="preview"
                  className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                />
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                {/* Paperclip button triggers file input click */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="pr-10"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isSending} // disable button while sending
                  className={cn(
                    chatMode === "hybrid"
                      ? "bg-gray-500 hover:bg-gray-600 disabled:opacity-50"
                      : "bg-gray-500 hover:bg-gray-600 disabled:opacity-50"
                  )}
                >
                  {isSending ? "Sending..." : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {/* Optional: show selected file name */}
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected file: {selectedFile.name}
                  <button
                    className="ml-2 text-red-500 hover:underline"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Select a customer to start chatting
              </h2>
              <p className="text-gray-500">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      <GeneratedTaskFormModal
        isOpen={showModal}
        aiTasks={aiTaskQueue}
        onClose={handelGenerateTaskCancel}
        onFormSubmit={handelGenerateTaskSubmit}
      />
    </div>
  );
}
