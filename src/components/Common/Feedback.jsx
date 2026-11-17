import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// In-page replacements for window.alert() and window.confirm():
//   const { notify, confirm } = useFeedback();
//   notify('Saved!', 'success');
//   if (await confirm({ message: 'Delete?', confirmLabel: 'Delete', danger: true })) ...

const FeedbackContext = createContext(null);

const TOAST_STYLES = {
    success: { icon: CheckCircle, className: 'border-green-500 text-green-700 dark:text-green-300' },
    error: { icon: AlertCircle, className: 'border-red-500 text-red-700 dark:text-red-300' },
    info: { icon: Info, className: 'border-blue-500 text-blue-700 dark:text-blue-300' }
};

const ConfirmDialog = ({ request, onClose }) => {
    const confirmRef = useRef(null);

    useEffect(() => {
        confirmRef.current?.focus();
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => onClose(false)}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 animate-fadeIn"
            >
                <h2 id="confirm-title" className="text-lg font-bold text-gray-900 dark:text-white">
                    {request.title || 'Are you sure?'}
                </h2>
                <p id="confirm-message" className="mt-2 text-gray-600 dark:text-gray-300">
                    {request.message}
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="rounded-lg px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        ref={confirmRef}
                        onClick={() => onClose(true)}
                        className={`rounded-lg px-4 py-2 font-semibold text-white ${request.danger
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg'
                            }`}
                    >
                        {request.confirmLabel || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const FeedbackProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmRequest, setConfirmRequest] = useState(null);
    const nextId = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const notify = useCallback((message, type = 'info') => {
        const id = ++nextId.current;
        setToasts(prev => [...prev.slice(-3), { id, message, type }]);
        setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
    }, [dismiss]);

    const pendingConfirm = useRef(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        pendingConfirm.current?.resolve(false); // a newer request replaces an open one
        const request = { ...options, resolve };
        pendingConfirm.current = request;
        setConfirmRequest(request);
    }), []);

    const closeConfirm = useCallback((result) => {
        pendingConfirm.current?.resolve(result);
        pendingConfirm.current = null;
        setConfirmRequest(null);
    }, []);

    return (
        <FeedbackContext.Provider value={{ notify, confirm }}>
            {children}

            <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[110] flex flex-col items-end gap-2 print:hidden">
                {toasts.map(({ id, message, type }) => {
                    const { icon: Icon, className } = TOAST_STYLES[type] || TOAST_STYLES.info;
                    return (
                        <div
                            key={id}
                            role={type === 'error' ? 'alert' : 'status'}
                            className={`flex w-full sm:w-96 items-start gap-3 rounded-xl border-l-4 bg-white p-4 shadow-xl dark:bg-gray-800 animate-fadeIn ${className}`}
                        >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{message}</p>
                            <button
                                type="button"
                                onClick={() => dismiss(id)}
                                aria-label="Dismiss notification"
                                className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {confirmRequest && <ConfirmDialog request={confirmRequest} onClose={closeConfirm} />}
        </FeedbackContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = () => {
    const ctx = useContext(FeedbackContext);
    if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
    return ctx;
};
