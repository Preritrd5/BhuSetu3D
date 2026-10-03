'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  DoorOpen,
  Layers,
  LayoutGrid,
  MapPin,
  X,
} from 'lucide-react';
import { ActiveSpatialSelection } from '@/types/selection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SheetState = 'CLOSED' | 'PEEKING' | 'OPEN';

export interface MobileInspectorSheetProps {
  selection: ActiveSpatialSelection;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Entity-type helpers
// ---------------------------------------------------------------------------

type EntityType = ActiveSpatialSelection['entityType'];

function EntityIcon({
  entityType,
  className,
}: {
  entityType: EntityType;
  className?: string;
}) {
  const props = { className: className ?? 'w-4 h-4', strokeWidth: 1.6 };
  switch (entityType) {
    case 'BUILDING':
      return <Building2 {...props} />;
    case 'FLOOR':
      return <Layers {...props} />;
    case 'UNIT':
      return <LayoutGrid {...props} />;
    case 'ROOM':
      return <DoorOpen {...props} />;
    case 'PARCEL':
    default:
      return <MapPin {...props} />;
  }
}

function entityBadgeStyle(entityType: EntityType): { bg: string; text: string } {
  switch (entityType) {
    case 'BUILDING':
    case 'UNIT':
      return { bg: 'bg-[#B56E48]/20', text: 'text-[#C47B50]' };
    case 'FLOOR':
    case 'PARCEL':
      return { bg: 'bg-[#23847D]/20', text: 'text-[#2EB8B0]' };
    default:
      return { bg: 'bg-[#1A201D]', text: 'text-[#A2B3A8]' };
  }
}

function entityIconColor(entityType: EntityType): string {
  switch (entityType) {
    case 'BUILDING':
    case 'UNIT':
      return 'text-[#C47B50]';
    case 'FLOOR':
    case 'PARCEL':
      return 'text-[#2EB8B0]';
    default:
      return 'text-[#A2B3A8]';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DragHandle() {
  return (
    <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
      <div className="w-10 h-1 rounded-full bg-[rgba(244,240,232,0.3)]" />
    </div>
  );
}

function EntityTypeBadge({ entityType }: { entityType: EntityType }) {
  const { bg, text } = entityBadgeStyle(entityType);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider uppercase ${bg} ${text} flex-shrink-0`}
    >
      {entityType}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MobileInspectorSheet({
  selection,
  isOpen,
  onClose,
  children,
}: MobileInspectorSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('CLOSED');

  // Sync isOpen prop → sheetState
  useEffect(() => {
    if (isOpen) {
      setSheetState((prev) => (prev === 'CLOSED' ? 'PEEKING' : prev));
    } else {
      setSheetState('CLOSED');
    }
  }, [isOpen]);

  // Derived transform / sizing classes
  const translateClass =
    sheetState === 'CLOSED' ? 'translate-y-full' : 'translate-y-0';

  const maxHeightStyle: React.CSSProperties =
    sheetState === 'OPEN' ? { maxHeight: '70vh' } : {};

  const roundedClass = sheetState === 'OPEN' ? 'rounded-t-[16px]' : '';

  const { entityType, title } = selection;
  const iconColorClass = entityIconColor(entityType);

  return (
    <>
      {/* Scrim — only rendered in OPEN state */}
      {sheetState === 'OPEN' && (
        <div
          className="fixed inset-0 z-[39] bg-black/40"
          onClick={() => setSheetState('PEEKING')}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal={sheetState === 'OPEN'}
        aria-label="Entity inspector"
        className={[
          'fixed bottom-[56px] inset-x-0 z-40',
          'bg-[#141816]',
          'border-t border-[rgba(244,240,232,0.12)]',
          'shadow-2xl',
          roundedClass,
          'transition-transform duration-300 ease-in-out',
          translateClass,
          'flex flex-col',
        ]
          .filter(Boolean)
          .join(' ')}
        style={maxHeightStyle}
      >
        {/* ----------------------------------------------------------------
            PEEKING state — compact single-row summary
        ---------------------------------------------------------------- */}
        {sheetState === 'PEEKING' && (
          <button
            type="button"
            className="w-full flex flex-col items-stretch focus:outline-none"
            onClick={() => setSheetState('OPEN')}
            aria-label="Expand inspector"
          >
            <DragHandle />
            {/* Compact row */}
            <div className="flex items-center gap-2 px-4 py-2">
              {/* Entity icon */}
              <span className={`flex-shrink-0 ${iconColorClass}`}>
                <EntityIcon entityType={entityType} className="w-4 h-4" />
              </span>

              {/* Type badge */}
              <EntityTypeBadge entityType={entityType} />

              {/* Title */}
              <span className="flex-1 min-w-0 text-sm font-medium text-[#F4F0E8] truncate text-left">
                {title}
              </span>

              {/* Inspect button */}
              <span className="flex-shrink-0 inline-flex items-center px-3 py-1 rounded-md bg-[#C47B50] text-[#F4F0E8] text-xs font-semibold leading-none">
                Inspect
              </span>
            </div>
          </button>
        )}

        {/* ----------------------------------------------------------------
            OPEN state — full sheet with header + scrollable content
        ---------------------------------------------------------------- */}
        {sheetState === 'OPEN' && (
          <>
            {/* Drag handle */}
            <DragHandle />

            {/* Header row */}
            <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
              {/* Entity icon */}
              <span className={`flex-shrink-0 ${iconColorClass}`}>
                <EntityIcon entityType={entityType} className="w-5 h-5" />
              </span>

              {/* Type badge */}
              <EntityTypeBadge entityType={entityType} />

              {/* Title */}
              <span className="flex-1 min-w-0 text-sm font-semibold text-[#F4F0E8] truncate">
                {title}
              </span>

              {/* Close button */}
              <button
                type="button"
                onClick={() => {
                  setSheetState('CLOSED');
                  onClose();
                }}
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-[#A2B3A8] hover:text-[#F4F0E8] hover:bg-[rgba(244,240,232,0.08)] transition-colors"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px mx-4 bg-[rgba(244,240,232,0.08)] flex-shrink-0" />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
          </>
        )}
      </div>
    </>
  );
}

export default MobileInspectorSheet;
