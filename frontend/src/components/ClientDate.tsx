"use client";
import React from "react";

export default function ClientDate({ dateString }: { dateString: string }) {
  const date = new Date(dateString);
  return <span>{date.toLocaleString()}</span>;
} 