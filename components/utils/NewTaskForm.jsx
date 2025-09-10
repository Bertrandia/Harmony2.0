"use client";
import { db } from "@/firebasedata/config";
import { collection, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";

export default function NewTaskForm({
  index,
  initialData,
  onSubmit,
  submissionStatus,
  onDelete,
  isFirstTaskSubmitted,
  isPatronTask,
}) {
  const [taskSubject, setTaskSubject] = useState(
    initialData.task_subject || ""
  );
  const [description, setDescription] = useState(initialData.description || "");
  const [taskSource, setTaskSource] = useState("WhatsApp");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [categoryTag, setCategoryTag] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]); // All categories
  const [allSubCategories, setAllSubCategories] = useState([]); // All sub-categories
  const [allCategoryTags, setAllCategoryTags] = useState([]); // All category tags
  const [error, setError] = useState("");

  const [curatorSkills, setCuratorSkills] = useState([]);
  const [selectedHomeCuratorDepartment, setSelectedHomeCuratorDepartment] =
    useState(null);
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskEndTime, setTaskEndTime] = useState("");
  const [assignedTimeSlot, setAssignedTimeSlot] = useState("");
  const [locationMode, setLocationMode] = useState("");

  useEffect(() => {
    setTaskSubject(initialData.task_subject || "");
    setDescription(initialData.description || "");
    setPriority(initialData.priority ?? "Medium");
    setDueDate(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().slice(0, 16);
    });
  }, [initialData]);

  useEffect(() => {
    async function fetchData() {
      const [catSnap, subSnap, tagSnap, curatorSnap] = await Promise.all([
        getDocs(collection(db, "d2cExpenseCategory")),
        getDocs(collection(db, "d2cExpenseSubCategory")),
        getDocs(collection(db, "d2cCategoryTagsNameList")),
        getDocs(collection(db, "curatorSkills")),
      ]);

      const categories = catSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const subCategories = subSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const categoryTags = tagSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const skills = curatorSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ref: docSnap.ref,
        ...docSnap.data(),
      }));

      setCategoryOptions(categories);
      setAllSubCategories(subCategories);
      setAllCategoryTags(categoryTags);
      setCuratorSkills(skills);
    }

    fetchData();
  }, []);

  const filteredSubCategories = allSubCategories.filter(
    (sub) => sub.categoryRef?.id === category?.id
  );
  const filteredCategoryTags = allCategoryTags.filter(
    (tag) =>
      tag.categoryRef?.id === category?.id &&
      tag.subCategoryRef?.id === subCategory?.id
  );

  const handleSubmit = () => {
    if (
      !taskSubject ||
      !description ||
      !category ||
      !subCategory ||
      !categoryTag ||
      !dueDate ||
      !priority ||
      (!isPatronTask && !taskSource) // ✅ only required if isTaskForm is false/undefined
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // If curator department selected, validate its fields
    if (
      selectedHomeCuratorDepartment &&
      selectedHomeCuratorDepartment !== "none"
    ) {
      if (
        !taskStartTime ||
        !taskEndTime ||
        !assignedTimeSlot ||
        !locationMode
      ) {
        setError("Please fill all curator-related fields.");
        return;
      }
    }

    setError("");
    

    const payload = {
      taskSubject,
      taskDescription: description,
      aiCreatedCategory: initialData?.category || "",
      aiCreatedSubCategory: initialData?.sub_category || "",
      aiCreatedCategoryTag: initialData?.category_tag || "",
      taskDueDate: Timestamp.fromDate(new Date(dueDate)),
      taskCategory: category?.categoryName || "",
      taskSubCategory: subCategory?.subCategoryName || "",
      categoryTag: categoryTag?.categoryTagName || "",
      priority,
      taskStatusCategory: "To be Started",
    };

    if (taskSource) {
      payload.taskSource = taskSource;
    }

    // Add curator fields if selected
    if (
      selectedHomeCuratorDepartment &&
      selectedHomeCuratorDepartment !== "none"
    ) {
      (payload.selectedHomeCuratorDepartment =
        selectedHomeCuratorDepartment.skill),
        (payload.selectedHomeCuratorDepartmentRef =
          selectedHomeCuratorDepartment.ref),
        (payload.taskStartTime = Timestamp.fromDate(new Date(taskStartTime)));
      payload.taskEndTime = Timestamp.fromDate(new Date(taskStartTime));
      payload.assignedTimeSlot = assignedTimeSlot;
      payload.locationMode = locationMode;
      payload.isCuratorTask = true;
      payload.curatorTaskStatus = "Not Assigned";
    } else {
      payload.isCuratorTask = false;
      payload.curatorTaskStatus = "";
    }
    
    onSubmit(payload, index);
  };

  return (
    <div className="min-w-[320px] w-full max-w-md border p-6 rounded-2xl bg-white shadow-xl flex flex-col space-y-3">
      <h3 className="text-lg font-semibold text-center">
        {index === 0 ? "Original Task (Update)" : `New Task ${index}`}
      </h3>

      {!isPatronTask && (
        <>
          <label className="text-sm font-medium">
            Task Source <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white"
            value={taskSource || ""}
            onChange={(e) => setTaskSource(e.target.value)}
          >
            <option value="">Select Task Source</option>
            <option value="On Call">On Call</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Physical">Physical</option>
            <option value="Text">Text</option>
            <option value="Others">Others</option>
          </select>
        </>
      )}
      <label className="text-sm font-medium">
        Task Subject <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={taskSubject}
        onChange={(e) => setTaskSubject(e.target.value)}
      />

      {/* Description */}
      <label className="text-sm font-medium">
        Task Description <span className="text-red-500">*</span>
      </label>
      <textarea
        rows="3"
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Category */}
      <label className="text-sm font-medium">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={category?.categoryName || ""}
        onChange={(e) => {
          const selected = categoryOptions.find(
            (cat) => cat.categoryName === e.target.value
          );
          setCategory(selected || null);
          setSubCategory(null);
          setCategoryTag(null);
        }}
      >
        <option value="">Select Category</option>
        {categoryOptions.map((cat) => (
          <option key={cat.id} value={cat.categoryName}>
            {cat.categoryName}
          </option>
        ))}
      </select>

      {/* Sub Category */}
      <label className="text-sm font-medium">
        Sub Category <span className="text-red-500">*</span>
      </label>
      <select
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={subCategory?.subCategoryName || ""}
        onChange={(e) => {
          const selected = filteredSubCategories.find(
            (sub) => sub.subCategoryName === e.target.value
          );
          setSubCategory(selected || null);
          setCategoryTag(null);
        }}
      >
        <option value="">Select Sub Category</option>
        {filteredSubCategories.map((sub) => (
          <option key={sub.id} value={sub.subCategoryName}>
            {sub.subCategoryName}
          </option>
        ))}
      </select>

      {/* Category Tag */}
      <label className="text-sm font-medium">
        Category Tag <span className="text-red-500">*</span>
      </label>
      <select
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={categoryTag?.categoryTagName || ""}
        onChange={(e) => {
          const selected = filteredCategoryTags.find(
            (tag) => tag.categoryTagName === e.target.value
          );
          setCategoryTag(selected || null);
        }}
      >
        <option value="">Select Category Tag</option>
        {filteredCategoryTags.map((tag) => (
          <option key={tag.id} value={tag.categoryTagName}>
            {tag.categoryTagName}
          </option>
        ))}
      </select>

      {/* Due Date */}
      <label className="text-sm font-medium flex justify-between items-center">
        <span>
          Due Date <span className="text-red-500">*</span>
        </span>
        <span className="text-xs text-orange-500 font-medium">
          Task Due Date
        </span>
      </label>
      <input
        type="datetime-local"
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      {/* Priority */}
      <label className="text-sm font-medium">
        Priority <span className="text-red-500">*</span>
      </label>
      <select
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
        <option value="High">High</option>
      </select>

      {/* Category */}
      {/* ... keep your existing category, subcategory, tag fields ... */}

      {/* Curator Department */}
      <label className="text-sm font-medium">Curator Department</label>
      <select
        className="w-full px-3 py-2 border rounded-lg bg-white"
        value={selectedHomeCuratorDepartment?.id || "none"}
        onChange={(e) => {
          if (e.target.value === "none") {
            setSelectedHomeCuratorDepartment(null);
          } else {
            const selected = curatorSkills.find((s) => s.id === e.target.value);
            setSelectedHomeCuratorDepartment(selected || null);
          }
        }}
      >
        <option value="none">None</option>
        {curatorSkills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.skill}
          </option>
        ))}
      </select>

      {/* Show extra fields only if curator selected */}
      {selectedHomeCuratorDepartment && (
        <>
          <label className="text-sm font-medium">Task Start Time</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg bg-white"
            value={taskStartTime}
            onChange={(e) => setTaskStartTime(e.target.value)}
          />

          <label className="text-sm font-medium">Task End Time</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg bg-white"
            value={taskEndTime}
            onChange={(e) => setTaskEndTime(e.target.value)}
          />

          {/* Assigned Time Slot */}
          <label className="text-sm font-medium">Assigned Time Slot</label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white"
            value={assignedTimeSlot}
            onChange={(e) => setAssignedTimeSlot(e.target.value)}
          >
            <option value="">Select Time Slot</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>

          {/* Location Mode */}
          <label className="text-sm font-medium">Location Mode</label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white"
            value={locationMode}
            onChange={(e) => setLocationMode(e.target.value)}
          >
            <option value="">Select Location Mode</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
          </select>
        </>
      )}

      {/* Validation Error */}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {/* Action Buttons */}
      {submissionStatus === "success" && (
        <div className="text-center text-green-600 font-semibold mt-4">
          ✅{" "}
          {index === 0
            ? "Task updated successfully!"
            : "Task added successfully!"}
        </div>
      )}

      {/* Buttons only show if task is not already submitted */}
      {submissionStatus !== "success" && (
        <div className="flex justify-between items-center mt-4">
          {/* Submit Button */}
          {index === 0 || isFirstTaskSubmitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              ✅ {index === 0 ? "Update" : "Add"}
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic">
              🔒 Submit/Delete First Task before submitting this one
            </span>
          )}

          {/* Delete Button */}
          {(index === 0 || isFirstTaskSubmitted) && (
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
