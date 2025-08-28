"use client";
import { db } from "@/firebasedata/config";
import { collection, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";

export default function NewTaskForm({
  index,
  initialData,
  onSubmit,
  submissionStatus,
  onDelete,
  isFirstTaskSubmitted,
}) {
  const [taskSubject, setTaskSubject] = useState(
    initialData.task_subject || ""
  );
  const [description, setDescription] = useState(initialData.description || "");

  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [categoryTag, setCategoryTag] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]); // All categories
  const [allSubCategories, setAllSubCategories] = useState([]); // All sub-categories
  const [allCategoryTags, setAllCategoryTags] = useState([]); // All category tags
  const [error, setError] = useState("");

  useEffect(() => {
    setTaskSubject(initialData.task_subject || "");
    setDescription(initialData.description || "");
    setPriority(initialData.priority || "");
    setDueDate(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().slice(0, 16);
    });
  }, [initialData]);

  useEffect(() => {
    async function fetchData() {
      const [catSnap, subSnap, tagSnap] = await Promise.all([
        getDocs(collection(db, "d2cExpenseCategory")),
        getDocs(collection(db, "d2cExpenseSubCategory")),
        getDocs(collection(db, "d2cCategoryTagsNameList")),
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

      setCategoryOptions(categories);
      setAllSubCategories(subCategories);
      setAllCategoryTags(categoryTags);
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

  const formatDueDate = (isoDate) => {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const handleSubmit = () => {
    if (
      !taskSubject ||
      !description ||
      !category ||
      !subCategory ||
      !categoryTag ||
      !dueDate ||
      !priority
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");

    onSubmit(
      {
        taskSubject,
        taskDescription: description,
        aiCreatedCategory: initialData?.category || "",
        aiCreatedSubCategory: initialData?.sub_category || "",
        aiCreatedCategoryTag: initialData?.category_tag || "",
        taskDueDate: formatDueDate(dueDate),
        taskCategory: category?.categoryName || "",
        taskSubCategory: subCategory?.subCategoryName || "",
        categoryTag: categoryTag?.categoryTagName || "",
        priority: priority,
        taskStatusCategory: "To be Started",
      },
      index
    );
  };

  return (
    <div className="min-w-[320px] w-full max-w-md border p-6 rounded-2xl bg-white shadow-xl flex flex-col space-y-3">
      <h3 className="text-lg font-semibold text-center">
        {index === 0 ? "Original Task (Update)" : `New Task ${index}`}
      </h3>

      {/* Task Subject */}
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
        <option value="">Select Priority</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
        <option value="High">High</option>
      </select>

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
