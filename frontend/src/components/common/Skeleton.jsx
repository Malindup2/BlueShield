import React from "react";

/**
 * A highly customizable skeleton component with shimmer effect.
 */
export const Skeleton = ({ 
  className = "", 
  variant = "text", // "text" | "circular" | "rectangular"
  width, 
  height, 
  ...props 
}) => {
  const baseStyles = "bg-slate-200 animate-pulse transition-all duration-700";
  
  const variantStyles = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`} 
      style={style}
      {...props}
    />
  );
};

export const SkeletonCard = ({ count = 1 }) => {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="12px" />
          <Skeleton width="40%" height="10px" />
        </div>
      </div>
      <Skeleton height="80px" />
      <div className="flex justify-between pt-2">
        <Skeleton width="30%" height="10px" />
        <Skeleton width="20%" height="10px" />
      </div>
    </div>
  ));
};

export const SkeletonTableRows = ({ rows = 5, cols = 4 }) => {
  return Array.from({ length: rows }).map((_, ri) => (
    <tr key={ri} className="animate-pulse">
      {Array.from({ length: cols }).map((_, ci) => (
        <td key={ci} className="p-4">
          <Skeleton width={ci === 0 ? "80%" : "50%"} />
        </td>
      ))}
    </tr>
  ));
};
