import React, { useEffect, useId, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from '../ui/Button';

const PANEL_WIDTH = 288; // w-72

const OPTIONS = [
    {
        format: 'csv',
        icon: FileSpreadsheet,
        label: 'Spreadsheet (.csv)',
        hint: 'Opens in Excel, Google Sheets or Numbers.'
    },
    {
        format: 'ics',
        icon: CalendarPlus,
        label: 'Calendar (.ics)',
        hint: 'Adds each activity to Google Calendar, Outlook or your phone, repeating every week.'
    },
    {
        format: 'pdf',
        icon: FileText,
        label: 'PDF',
        hint: 'Opens Print. Choose “Save as PDF” as the printer.'
    }
];

// "Export" button with a small list of file formats. A disclosure (button +
// list of buttons) rather than an ARIA menu, so Tab and Enter work as usual.
const ExportMenu = ({ onExport }) => {
    const [open, setOpen] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const toggle = () => {
        if (!open && buttonRef.current) {
            // Open towards whichever side has room, so the list stays on screen.
            const rect = buttonRef.current.getBoundingClientRect();
            setAlignRight(rect.left + PANEL_WIDTH > window.innerWidth - 16);
        }
        setOpen((value) => !value);
    };

    const choose = (format) => {
        setOpen(false);
        buttonRef.current?.focus();
        if (format === 'pdf') window.print();
        else onExport(format);
    };

    return (
        <div
            ref={rootRef}
            className="relative"
            onBlur={(e) => {
                if (open && !rootRef.current?.contains(e.relatedTarget)) setOpen(false);
            }}
        >
            <Button
                ref={buttonRef}
                variant="secondary"
                size="sm"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={panelId}
            >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
                <ChevronDown
                    className={`h-3.5 w-3.5 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </Button>

            {open && (
                <div
                    id={panelId}
                    className={`absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-rule bg-surface p-1.5 shadow-lg ${alignRight ? 'right-0' : 'left-0'}`}
                >
                    <ul>
                        {OPTIONS.map((option) => (
                            <li key={option.format}>
                                <button
                                    type="button"
                                    onClick={() => choose(option.format)}
                                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-sunken"
                                >
                                    <option.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                                    <span>
                                        <span className="block text-sm font-semibold text-ink">{option.label}</span>
                                        <span className="block text-xs text-muted">{option.hint}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
