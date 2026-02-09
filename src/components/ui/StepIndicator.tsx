

export interface Step {
    id: string;
    label: string;
    description?: string;
}

export interface StepIndicatorProps {
    steps: Step[];
    currentStep: string;
    completedSteps?: string[];
    orientation?: 'horizontal' | 'vertical';
    onStepClick?: (stepId: string) => void;
    className?: string;
}

export function StepIndicator({
    steps,
    currentStep,
    completedSteps = [],
    orientation = 'vertical',
    onStepClick,
    className = '',
}: StepIndicatorProps) {
    const isHorizontal = orientation === 'horizontal';

    const getStepState = (stepId: string) => {
        if (completedSteps.includes(stepId)) return 'completed';
        if (stepId === currentStep) return 'active';
        return 'pending';
    };

    const CheckIcon = () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );

    return (
        <nav aria-label="Progress" className={className}>
            <ol className={`${isHorizontal ? 'flex items-center' : 'space-y-4'}`}>
                {steps.map((step, index) => {
                    const state = getStepState(step.id);
                    const isClickable = onStepClick && (state === 'completed' || state === 'active');

                    return (
                        <li key={step.id} className={`${isHorizontal ? 'flex-1' : ''} relative`}>
                            <div className={`flex ${isHorizontal ? 'flex-col items-center' : 'items-start'}`}>
                                {/* Connector line */}
                                {index > 0 && (
                                    <div
                                        className={`
                      ${isHorizontal
                                                ? 'absolute top-4 left-0 w-full h-0.5 -translate-y-1/2'
                                                : 'absolute top-0 left-4 w-0.5 h-full -translate-x-1/2'
                                            }
                      ${state === 'pending' ? 'bg-gray-200' : 'bg-foundry-blue'}
                    `}
                                        style={isHorizontal ? { right: '50%', left: 'auto', width: '100%' } : { top: '-100%' }}
                                    />
                                )}

                                {/* Step circle */}
                                <button
                                    onClick={() => isClickable && onStepClick?.(step.id)}
                                    disabled={!isClickable}
                                    className={`
                    relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                    text-sm font-medium transition-colors
                    ${!isClickable ? 'cursor-default' : 'cursor-pointer'}
                    ${state === 'completed' ? 'bg-foundry-blue text-white' : ''}
                    ${state === 'active' ? 'bg-foundry-blue text-white ring-4 ring-blue-100' : ''}
                    ${state === 'pending' ? 'bg-gray-100 text-gray-500 border-2 border-gray-300' : ''}
                  `}
                                >
                                    {state === 'completed' ? <CheckIcon /> : index + 1}
                                </button>

                                {/* Label */}
                                <div className={`${isHorizontal ? 'mt-2 text-center' : 'ml-4'}`}>
                                    <p className={`text-sm font-medium ${state === 'pending' ? 'text-gray-500' : 'text-gray-900'}`}>
                                        {step.label}
                                    </p>
                                    {step.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
