import React from 'react';
import { useStore, WorkflowStep } from '../store/useStore';

const steps: Array<{
  id: WorkflowStep;
  label: string;
  description: string;
}> = [
  {
    id: 'map',
    label: 'Map',
    description: 'Select a site to explore'
  },
  {
    id: 'schematic',
    label: 'Site Schematic',
    description: 'Arrange and inspect site images'
  },
  {
    id: 'annotation',
    label: 'Annotation Editor',
    description: 'Open an image in the editor'
  }
];

export default function WorkflowSidebar() {
  const {
    workflowStep,
    setWorkflowStep,
    selectedSiteIds,
    currentImageId,
    setAnnotationOpen
  } = useStore();

  const isStepDisabled = (step: WorkflowStep) => {
    if (step === 'schematic') return selectedSiteIds.length === 0;
    if (step === 'annotation') return !currentImageId;
    return false;
  };

  const handleStepClick = (step: WorkflowStep) => {
    const disabled = isStepDisabled(step);
    if (disabled) return;

    if (step === 'annotation') {
      if (currentImageId) {
        setWorkflowStep('annotation');
        setAnnotationOpen(true);
      }
      return;
    }

    setAnnotationOpen(false);
    setWorkflowStep(step);
  };

  const isStepComplete = (step: WorkflowStep) => {
    if (step === 'map') return selectedSiteIds.length > 0;
    if (step === 'schematic') return !!currentImageId;
    if (step === 'annotation') return workflowStep === 'annotation';
    return false;
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
          Workflow
        </div>
        <div className="text-base font-semibold text-gray-900">
          Dura-Europos Review
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Move through each step to go from the map to annotations.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.map((step, index) => {
          const isActive = workflowStep === step.id;
          const disabled = isStepDisabled(step.id);
          const complete = isStepComplete(step.id);

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              disabled={disabled}
              className={[
                'w-full text-left rounded-xl border px-4 py-3 transition',
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400',
                isActive ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{step.label}</span>
                </div>
                {complete && (
                  <span className="text-xs font-semibold text-green-600">Done</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{step.description}</p>

              {step.id === 'schematic' && selectedSiteIds.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-2">
                  Select a site on the map to unlock this step.
                </p>
              )}
              {step.id === 'annotation' && !currentImageId && (
                <p className="text-[11px] text-amber-600 mt-2">
                  Click an image in the schematic to open the editor.
                </p>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

