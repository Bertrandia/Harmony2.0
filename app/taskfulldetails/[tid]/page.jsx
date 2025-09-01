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
      isUpdate: false,
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

  if (loading) return <p className="p-4">Loading task...</p>;
  if (!taskData) return <p className="p-4 text-red-600">Task not found</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {/* Patron Card */}
      {patrondata && (
        <div className="bg-white shadow rounded p-4 border mb-6">
          <h2 className="text-lg font-semibold mb-3">👤 Patron Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span>{" "}
              {patrondata.patronName || "N/A"}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {patrondata.email || "N/A"}
            </div>
            <div>
              <span className="font-medium">Assigned LM:</span>{" "}
              {patrondata.assignedLM || "N/A"}
            </div>
            <div>
              <span className="font-medium">Role:</span>{" "}
              {patrondata.role || "N/A"}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold mb-4">📝 Task Details</h1>

      <form className="space-y-4">
        {/* Task ID (readonly) */}
        <div>
          <label className="font-medium">Task ID</label>
          <input
            type="text"
            name="taskID"
            value={formData.taskID || ""}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Cascading Dropdowns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Priority</label>
            <select
              name="priority"
              value={formData.priority || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full p-2 border rounded"
            >
              <option value="" disabled>
                Select Priority
              </option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label>Task Status Category</label>
            <select
              name="taskStatusCategory"
              value={formData.taskStatusCategory || ""}
              onChange={handleInputChange}
              disabled
              className="w-full p-2 border rounded"
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="To be Started">To be Started</option>
              <option value="In Process">In Process</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label>Category</label>
            <select
              name="taskCategory"
              value={selectedCategory?.categoryName || ""}
              onChange={handleCategoryChange}
              disabled={!isEditing}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Category</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.categoryName}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>SubCategory</label>
            <select
              name="taskSubCategory"
              value={selectedSubCategory?.subCategoryName || ""}
              onChange={handleSubCategoryChange}
              disabled={!isEditing || !selectedCategory}
              className="w-full p-2 border rounded"
            >
              <option value="">Select SubCategory</option>
              {filteredSubCategories.map((sub) => (
                <option key={sub.id} value={sub.subCategoryName}>
                  {sub.subCategoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Category Tag</label>
            <select
              name="categoryTag"
              value={selectedCategoryTag?.categoryTagName || ""}
              onChange={handleCategoryTagChange}
              disabled={!isEditing || !selectedSubCategory}
              className="w-full p-2 border rounded"
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

        {/* AI-created fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>AI Created Category</label>
            <input
              name="aiCreatedCategory"
              value={formData.aiCreatedCategory || ""}
              disabled
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>AI Created SubCategory</label>
            <input
              name="aiCreatedSubCategory"
              value={formData.aiCreatedSubCategory || ""}
              disabled
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>AI Created Category Tag</label>
            <input
              name="aiCreatedCategoryTag"
              value={formData.aiCreatedCategoryTag || ""}
              disabled
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Task Subject */}
        <div>
          <label>Task Subject</label>
          <input
            name="taskSubject"
            value={formData.taskSubject || ""}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Created By</label>
          <input
            name="createdBy"
            value={formData.createdBy || ""}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Billing Model */}
        <div>
          <label>Billing Model</label>
          <input
            name="billingModel"
            value={formData.billingModel || ""}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Task Assign Date */}
        <div>
          <label>Task Assign Date</label>
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
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Task Due Date */}
        <div>
          <label>Task Due Date</label>
          <input
            name="taskDueDate"
            type="text"
            value={formData.taskDueDate || ""}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Error message display */}
        {error && (
          <div className="text-red-600 font-medium text-sm text-center">
            {error}
          </div>
        )}

        {/* Buttons */}
        {!isEditing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowNotePopup(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {showNotePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">📝 Add a Note</h2>
            <textarea
              className="w-full p-2 border rounded mb-4"
              rows="4"
              placeholder="Write your note here..."
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNotePopup(false);
                  setUpdateNote(""); // reset if canceled
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNotePopup(false);
                  handleUpdate(); // proceed with the update
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Note & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
