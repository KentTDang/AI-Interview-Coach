"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Metrics {
  handDetectionCounter: number;
  handDetectionDuration: number;
  notFacingCounter: number;
  notFacingDuration: number;
  badPostureDetectionCounter: number;
  badPostureDuration: number;
}

interface MetricsContextType {
  metrics: Metrics;
  updateMetrics: (updates: Partial<Metrics>) => void;
}

const defaultMetrics: Metrics = {
  handDetectionCounter: 0,
  handDetectionDuration: 0,
  notFacingCounter: 0,
  notFacingDuration: 0,
  badPostureDetectionCounter: 0,
  badPostureDuration: 0,
};

const MetricsContext = createContext<MetricsContextType>({
  metrics: defaultMetrics,
  updateMetrics: () => {},
});

export const MetricsProvider = ({ children }: { children: ReactNode }) => {
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);

  const updateMetrics = (updates: Partial<Metrics>) => {
    setMetrics((prev) => ({ ...prev, ...updates }));
  };

  return (
    <MetricsContext.Provider value={{ metrics, updateMetrics }}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);