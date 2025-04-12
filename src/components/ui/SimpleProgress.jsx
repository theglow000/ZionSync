import React from "react";

export function SimpleProgress({ value = 0, className = "", bgColor = "bg-gray-200", valueColor = "bg-blue-500" }) {
  return (
    <div className={`relative w-full h-2 overflow-hidden rounded-full ${bgColor} ${className}`}>
      <div 
        className={`absolute top-0 left-0 h-full ${valueColor} transition-all duration-300`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}