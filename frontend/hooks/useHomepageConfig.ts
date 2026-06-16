"use client";

import { useEffect, useState } from "react";
import type { HomepageConfig } from "@/lib/homepage-config/types";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-config/defaults";

export function useHomepageConfig(initialConfig?: HomepageConfig) {
  const [config, setConfig] = useState<HomepageConfig>(initialConfig ?? DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(!initialConfig);

  useEffect(() => {
    fetch("/api/homepage-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
