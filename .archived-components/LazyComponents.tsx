// src/components/LazyComponents.tsx
"use client";
import { lazy, Suspense } from 'react';
import ErrorBoundary from './EnhancedErrorBoundary';

// Lazy load heavy 3D components
export const LazyCanvasScene = lazy(() => import('./CanvasScene'));
export const LazyAudioVisualizer = lazy(() => import('./AudioVisualizer'));
export const LazyShapeEditorPanel = lazy(() => import('./ShapeEditorPanel'));

// Loading fallback component
const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    <span className="ml-2 text-white opacity-70">{message}</span>
  </div>
);

// HOC for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  loadingMessage?: string,
  context?: string
) {
  return function LazyWrapper(props: T) {
    return (
      <ErrorBoundary context={context ?? 'LazyComponent'}>
        <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Pre-configured lazy components with error boundaries
export const SafeLazyCanvasScene = withLazyLoading(
  LazyCanvasScene,
  "Loading 3D Scene...",
  "CanvasScene"
);

export const SafeLazyAudioVisualizer = withLazyLoading(
  LazyAudioVisualizer,
  "Loading Audio Visualizer...",
  "AudioVisualizer"
);


export const SafeLazyShapeEditorPanel = withLazyLoading(
  LazyShapeEditorPanel,
  "Loading Shape Editor...",
  "ShapeEditorPanel"
);
