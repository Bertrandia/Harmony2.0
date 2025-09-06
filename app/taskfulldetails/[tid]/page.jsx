"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  Timestamp,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../firebasedata/config";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  Building,
  Calendar,
  Clock,
  Edit3,
  FileText,
  Save,
  Tag,
  User,
  X,
} from "lucide-react";
import TaskDetailsShimmer from "../../../components/utils/TaskDetailsShimmer";

export default function TaskDetailsPage() {
  const { tid } = useParams();
  const { userDetails } = useAuth();

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [patrondata, setPatronData] = useState(null);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [updateNote, setUpdateNote] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allCategoryTags, setAllCategoryTags] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedCategoryTag, setSelectedCategoryTag] = useState(null);

  useEffect(() => {
    async function fetchDropdownData() {
      try {
        const [catSnap, subSnap, tagSnap] = await Promise.all([
          getDocs(collection(db, "d2cExpenseCategory")),
          getDocs(collection(db, "d2cExpenseSubCategory")),
          getDocs(collection(db, "d2cCategoryTagsNameList")),
        ]);

        setCategoryOptions(
          catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setAllSubCategories(
          subSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setAllCategoryTags(
          tagSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      }
    }

    fetchDropdownData();
  }, []);

  // Fetch task data on mount or tid change
  useEffect(() => {
    const fetchTask = async () => {
      if (!tid) return;

      try {
        const docRef = doc(db, "createTaskCollection", tid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const patronDocRef = doc(db, "addPatronDetails", data?.patronRef?.id);
          const patrondocSnap = await getDoc(patronDocRef);
          if (docSnap.exists()) {
            const pdata = patrondocSnap.data();
            setPatronData(pdata);

            setTaskData(data);
            setFormData(data);
          }
        } else {
          console.warn("No such task!");
          setTaskData(null);
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        setTaskData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [tid]);

  const getChangedFields = () => {
    const changes = [];

    if (formData.priority !== taskData.priority) changes.push("priority");
    if (formData.taskCategory !== taskData.taskCategory)
      changes.push("taskCategory");
    if (formData.taskSubCategory !== taskData.taskSubCategory)
      changes.push("taskSubCategory");
    if (formData.categoryTag !== taskData.categoryTag)
      changes.push("categoryTag");

    return changes;
  };

  // Sync selected dropdown objects when taskData or dropdown options update
  useEffect(() => {
    if (
      taskData &&
      categoryOptions.length &&
      allSubCategories.length &&
      allCategoryTags.length
    ) {
      const categoryObj =
        categoryOptions.find((c) => c.categoryName === taskData.taskCategory) ||
        null;
      const subCategoryObj =
        allSubCategories.find(
          (s) => s.subCategoryName === taskData.taskSubCategory
        ) || null;
      const categoryTagObj =
        allCategoryTags.find(
          (t) => t.categoryTagName === taskData.categoryTag
        ) || null;

      setSelectedCategory(categoryObj);
      setSelectedSubCategory(subCategoryObj);
      setSelectedCategoryTag(categoryTagObj);
    }
  }, [taskData, categoryOptions, allSubCategories, allCategoryTags]);

  // Filter subcategories and tags based on selection
  const filteredSubCategories = allSubCategories.filter(
    (sub) => sub.categoryRef?.id === selectedCategory?.id
  );
  const filteredCategoryTags = allCategoryTags.filter(
    (tag) =>
      tag.categoryRef?.id === selectedCategory?.id &&
      tag.subCategoryRef?.id === selectedSubCategory?.id
  );

  // Handle input changes for other fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handlers for dropdown changes
  const handleCategoryChange = (e) => {
    const categoryName = e.target.value;
    const cat =
      categoryOptions.find((c) => c.categoryName === categoryName) || null;

    setSelectedCategory(cat);
    setSelectedSubCategory(null);
    setSelectedCategoryTag(null);

    setFormData((prev) => ({
      ...prev,
      taskCategory: categoryName,
      taskSubCategory: "",
      categoryTag: "",
    }));
  };

  const handleSubCategoryChange = (e) => {
    const subCategoryName = e.target.value;
    const sub =
      filteredSubCategories.find(
        (s) => s.subCategoryName === subCategoryName
      ) || null;

    setSelectedSubCategory(sub);
    setSelectedCategoryTag(null);

    setFormData((prev) => ({
      ...prev,
      taskSubCategory: subCategoryName,
      categoryTag: "",
    }));
  };

  const handleCategoryTagChange = (e) => {
    const tagName = e.target.value;
    const tag =
      filteredCategoryTags.find((t) => t.categoryTagName === tagName) || null;

    setSelectedCategoryTag(tag);

    setFormData((prev) => ({
      ...prev,
      categoryTag: tagName,
    }));
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setFormData(taskData);
    // Restore all field values

    // Restore selected dropdown objects based on original taskData
    const categoryObj = categoryOptions.find(
      (c) => c.categoryName === taskData.taskCategory
    );
    const subCategoryObj = allSubCategories.find(
      (s) => s.subCategoryName === taskData.taskSubCategory
    );
    const categoryTagObj = allCategoryTags.find(
      (t) => t.categoryTagName === taskData.categoryTag
    );

    setSelectedCategory(categoryObj || null);
    setSelectedSubCategory(subCategoryObj || null);
    setSelectedCategoryTag(categoryTagObj || null);

    setIsEditing(false);
    setUpdateNote("");
    setError(""); // Exit edit mode
  };

  const handleUpdate = async () => {
    const changedFields = getChangedFields();
    if (
      !formData.taskSubject ||
      !formData.priority ||
      !selectedCategory ||
      !selectedSubCategory ||
      !selectedCategoryTag
    ) {
      setError("❌ Please fill in all required fields before updating.");
      return;
    }

    if (changedFields.length === 0) {
      setError("No changes detected.");
      setUpdateNote("");
      return;
    }

    if (!updateNote.trim()) {
      setError("❌ Please provide an update note.");
      setUpdateNote("");
      return;
    }

    setError("");

    const displayName = userDetails?.email || "Unknown User";
    let commentText = "";

    if (changedFields.length === 1) {
      commentText = `${changedFields[0]} was updated by ${displayName} and the reason is ${updateNote}`;
    } else {
      commentText = `${changedFields.join(
        ", "
      )} were updated by ${displayName} and the reason is ${updateNote}`;
    }

    const taskdocRef = doc(db, "createTaskCollection", tid);

    const updatedData = {
      taskCategory: selectedCategory.categoryName,
      taskSubCategory: selectedSubCategory.subCategoryName,
      categoryTag: selectedCategoryTag.categoryTagName,
      priority: formData.priority,
      updateReason: updateNote,
      updatedAt: Timestamp.now(),
      updatedBy: userDetails?.email,
      isUpdated: true,
    };
    const commentDoc = {
      comment_text: commentText,
      isTaskUpdated: true,
      commentedBy: userDetails?.email,
      commentedAt: Timestamp.now(),
      comment_owner_name: userDetails?.display_name || userDetails?.email,
      comment_owner_img: userDetails?.photo_url || "",
      commentDate: Timestamp.now(),
      isUpdate: true,
      taskStatusCategory: taskData?.taskStatusCategory,
      taskRef: taskdocRef,
    };

    try {
      await updateDoc(taskdocRef, updatedData);

      const updatedRef = collection(taskdocRef, "commentsThread");
      await addDoc(updatedRef, commentDoc);

      setTaskData({ ...taskData, ...updatedData });
      setUpdateNote("");
      setShowNotePopup(false);
      setIsEditing(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  if (loading) return <TaskDetailsShimmer />;
  if (!taskData) return <p className="p-4 text-red-600">Task not found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Management System
          </h1>
          <p className="text-gray-600">
            Manage and track your project tasks efficiently
          </p>
        </div>

        {/* Patron Card */}
        {patrondata && (
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Patron Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-gray-500 block">Name</span>
                  <span className="font-semibold text-gray-800">
                    {patrondata.patronName || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-gray-500 block">Email</span>
                  <span className="font-semibold text-gray-800">
                    {patrondata.email || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-gray-500 block">
                    Assigned LM
                  </span>
                  <span className="font-semibold text-gray-800">
                    {patrondata.assignedLM || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-gray-500 block">Role</span>
                  <span className="font-semibold text-gray-800">
                    {patrondata.role || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Details Form */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-500 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Task Details</h1>
            </div>

            <div className="pt-6 border-t border-gray-200">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-600 text-white rounded-xl hover:from-gray-700 hover:to-gray-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Task
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowNotePopup(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    Update Task
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <form className="p-8 space-y-8">
            {/* Task ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4" />
                Task ID
              </label>
              <input
                type="text"
                name="taskID"
                value={formData.taskID || ""}
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-600 focus:outline-none"
              />
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <AlertCircle className="w-4 h-4" />
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                  }`}
                >
                  <option value="" disabled>
                    Select Priority
                  </option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4" />
                  Task Status Category
                </label>
                <select
                  name="taskStatusCategory"
                  value={formData.taskStatusCategory || ""}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value="To be Started">⏳ To be Started</option>
                  <option value="In Process">🔄 In Process</option>
                  <option value="Completed">✅ Completed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Category Selection
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <select
                    name="taskCategory"
                    value={selectedCategory?.categoryName || ""}
                    onChange={handleCategoryChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.id} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    SubCategory
                  </label>
                  <select
                    name="taskSubCategory"
                    value={selectedSubCategory?.subCategoryName || ""}
                    onChange={handleSubCategoryChange}
                    disabled={!isEditing || !selectedCategory}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      !isEditing || !selectedCategory
                        ? "bg-gray-50 text-gray-600"
                        : "bg-white"
                    }`}
                  >
                    <option value="">Select SubCategory</option>
                    {filteredSubCategories.map((sub) => (
                      <option key={sub.id} value={sub.subCategoryName}>
                        {sub.subCategoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Category Tag
                  </label>
                  <select
                    name="categoryTag"
                    value={selectedCategoryTag?.categoryTagName || ""}
                    onChange={handleCategoryTagChange}
                    disabled={!isEditing || !selectedSubCategory}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      !isEditing || !selectedSubCategory
                        ? "bg-gray-50 text-gray-600"
                        : "bg-white"
                    }`}
                  >
                    <option value="">Select Category Tag</option>
                    {filteredCategoryTags.map((tag) => (
                      <option key={tag.id} value={tag.categoryTagName}>
                        {tag.categoryTagName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* AI Created Fields */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-purple-100 rounded">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  AI Generated Categories
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    AI Created Category
                  </label>
                  <input
                    name="aiCreatedCategory"
                    value={formData.aiCreatedCategory || ""}
                    disabled
                    className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    AI Created SubCategory
                  </label>
                  <input
                    name="aiCreatedSubCategory"
                    value={formData.aiCreatedSubCategory || ""}
                    disabled
                    className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    AI Created Category Tag
                  </label>
                  <input
                    name="aiCreatedCategoryTag"
                    value={formData.aiCreatedCategoryTag || ""}
                    disabled
                    className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4" />
                  Task Subject
                </label>
                <input
                  name="taskSubject"
                  value={formData.taskSubject || ""}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4" />
                    Created By
                  </label>
                  <input
                    name="createdBy"
                    value={formData.createdBy || ""}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building className="w-4 h-4" />
                    Billing Model
                  </label>
                  <input
                    name="billingModel"
                    value={formData.billingModel || ""}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Task Assign Date
                  </label>
                  <input
                    type="date"
                    name="taskAssignDate"
                    value={
                      formData.taskAssignDate?.seconds
                        ? new Date(formData.taskAssignDate.seconds * 1000)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Task Due Date
                  </label>
                  <input
                    name="taskDueDate"
                    type="date"
                    value={
                      formData.taskDueDate?.seconds
                        ? new Date(formData.taskDueDate.seconds * 1000)
                            .toISOString()
                            .split("T")[0] // gives YYYY-MM-DD
                        : ""
                    }
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error message display */}

            {/* Action Buttons */}
          </form>
        </div>

        {/* Note Popup Modal */}
        {showNotePopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Add Update Note
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <textarea
                  className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows="4"
                  placeholder="Write your update note here..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-1 p-2 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowNotePopup(false);
                    setUpdateNote("");
                    setError("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // setShowNotePopup(false);
                    handleUpdate();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-600 text-white rounded-lg hover:from-gray-700 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  Submit & Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
