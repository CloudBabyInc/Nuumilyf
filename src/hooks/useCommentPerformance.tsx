import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  scrollPerformance: number;
}

export function useCommentPerformance(postId: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    scrollPerformance: 0
  });

  const startTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);

  // Track load time
  const startLoadTimer = () => {
    startTime.current = performance.now();
  };

  const endLoadTimer = () => {
    const loadTime = performance.now() - startTime.current;
    setMetrics(prev => ({ ...prev, loadTime }));
  };

  // Track render time
  const startRenderTimer = () => {
    renderStartTime.current = performance.now();
  };

  const endRenderTimer = () => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  };

  // Monitor memory usage
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Track scroll performance
  const trackScrollPerformance = () => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        setMetrics(prev => ({ ...prev, scrollPerformance: fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  };

  // Performance recommendations
  const getRecommendations = () => {
    const recommendations: string[] = [];

    if (metrics.loadTime > 1000) {
      recommendations.push('Consider implementing pagination for comments');
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Memory usage is high - enable cache cleanup');
    }

    if (metrics.scrollPerformance < 30) {
      recommendations.push('Scroll performance is poor - reduce item complexity');
    }

    return recommendations;
  };

  return {
    metrics,
    startLoadTimer,
    endLoadTimer,
    startRenderTimer,
    endRenderTimer,
    trackScrollPerformance,
    recommendations: getRecommendations(),
    isPerformant: metrics.loadTime < 500 && metrics.memoryUsage < 30 && metrics.scrollPerformance > 45
  };
}
