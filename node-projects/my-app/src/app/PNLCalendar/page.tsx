"use client";

import TradingCalendar from './full-calendar';
import { VersionBadge } from "@/components/VersionBadge";

const PNLCalendar = () => {
  return (
    <div className="container mx-auto p-4">
      <TradingCalendar />
      <VersionBadge projectName="PNLCalendar" />
    </div>
  );
};

export default PNLCalendar;
