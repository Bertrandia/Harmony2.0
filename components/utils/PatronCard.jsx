import React, { useState } from "react";
import { Phone, MapPin, User, MoreHorizontal, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PatronCard = ({
  patrondata,
  onGenerate,
  handelCreateTask,
  handelAlltasks,
  handelAllExpenses,
  handelCreateTaskWithImage,
}) => {
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Toggle menu

  if (!patrondata) return null;
  const patronAddress = [
    patrondata?.addressLine1,
    patrondata?.addressLine2,
    patrondata?.city,
    patrondata?.state,
    patrondata?.pinCode,
    patrondata?.country,
  ]
    .filter(Boolean) // Remove null/undefined/empty
    .join(", ");

  const {
    patronName,
    assignedLM,
    email,
    mobile_number1,
    bannerImage,
    city,
    patronStatus,
    patronType,
  } = patrondata;

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    return words.length === 1
      ? words[0].charAt(0).toUpperCase()
      : words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
  };

  const getStatusColor = (patronStatus) => {
    switch (patronStatus) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Churn":
        return "bg-orange-600 text-gray-700";
      case "In":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (patronType) => {
    switch (patronType) {
      case "B2C":
        return "bg-yellow-100 text-yellow-800";
      case "Corporate Partner's Client - Client Paid":
        return "bg-blue-200 text-gray-800";
      case "Individual / Family":
        return "bg-orange-100 text-orange-800";
      case "Corporate Partner's Employee - Partner Paid":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg overflow-hidden">
            {imgError || !bannerImage ? (
              getInitials(patronName)
            ) : (
              <img
                src={bannerImage}
                alt={patronName}
                className="w-12 h-12 rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              {patronName || "No Name"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {email || "No email"}
            </p>
          </div>
        </div>

        {/* Three dots menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          {/* Popup menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  handelCreateTask?.(patrondata);
                  setMenuOpen(false);
                }}
              >
                Create Task - Manual
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  handelCreateTask?.(patrondata);
                  setMenuOpen(false);
                }}
              >
                Create Task - WA Chat Text
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  handelCreateTaskWithImage?.(patrondata);
                  setMenuOpen(false);
                }}
              >
                Create Task - WA Image
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  handelAlltasks?.(patrondata);
                  setMenuOpen(false);
                }}
              >
                All Tasks
              </button>
              {/* <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  handelAllExpenses?.(patrondata);
                  setMenuOpen(false);
                }}
              >
                All Expenses
              </button> */}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          <span>{mobile_number1 || "No phone"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{city || "No address"}</span>
        </div>
        <div className="flex items-start gap-2">
          <Home className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-all whitespace-normal flex-1">
            {patronAddress|| "No Address"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>LM: {assignedLM || "Unassigned"}</span>
        </div>
      </div>

      {/* Status + Tier */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={getStatusColor(patronStatus)}>
            {patronStatus || "Unknown"}
          </Badge>
          <Badge className={getTypeColor(patronType)}>
            {patronType || "Standard"}
          </Badge>
        </div>
      </div>

      {/* Generate EOD */}
      <div className="mt-4">
        {/* Actions (Small Buttons like Generate EOD) */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => onGenerate?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            Generate EOD
          </button>

          <button
            onClick={() => handelCreateTask?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            Create Task - Manual
          </button>

          <button
            onClick={() => handelCreateTask?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            Create Task - WA Chat Text
          </button>

          <button
            onClick={() => handelCreateTaskWithImage?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            Create Task - WA Image
          </button>

          <button
            onClick={() => handelAlltasks?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            All Tasks
          </button>

          {/* <button
            onClick={() => handelAllExpenses?.(patrondata)}
            className="px-3 py-1 text-sm font-medium rounded-lg 
        bg-gradient-to-r from-gray-700 to-gray-500 text-white 
        shadow-md hover:from-gray-600 hover:to-gray-400 
        active:scale-95 transition-all duration-200"
          >
            All Expenses
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default PatronCard;
