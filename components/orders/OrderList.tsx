
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStatus, OrderFilters, Pagination } from '../../types';
import { api } from '../../services/api';
import StatusBadge from '../core/StatusBadge';
import { RefreshIcon, FilterIcon, ChevronRightIcon, SpeakerOnIcon, SpeakerOffIcon, CalendarIcon } from '../core/Icons';
import { ORDER_STATUS_MAP, NEXT_ACTION_MAP } from '../../constants';
import PaginationControls from '../core/PaginationControls';
import LoadingSpinner from '../core/LoadingSpinner';

interface OrderListProps {
    onSelectOrder: (orderId: string) => void;
}

// A simple notification sound embedded as a Base64 data URL to avoid external file dependencies.
const NOTIFICATION_SOUND_URL = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIGN1dCAxNjM4MzM4ODg2RgBQTFNZAAAGgAFQTFNZgAYAAAABAAAAh25kZWZpbmVkAAAAAEsyFmIAAQAAAKgAAAAAAD/+9DEgAEMAqgABkAIlVABmCo+k/wCTSAAAAASANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAAAABJGF2YzEAAAAAAAAABAAAAAAAEgAAABAAAAAAAAAABQf/7+9DEAAAzf/+9DEgAEMAqgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAJgABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMAgAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMA8AABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBEAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBIAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBMAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAABkAIlVABmCo+k/wCTSAAAAAQANiABQDJAABMAAAGwVjExQkEAAAAAAA4yNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/+9DEgAEMBQAAAAC3AAAAAAAAAAVFNJU1BfQ09ERVMAAAAAB1Vua25vd24=';

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return dateString; // Fallback for invalid dates
    }
    // Format: DD/MM/YYYY HH:mm
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return '';
    }
    // Format: HH:mm
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};


const OrderCard: React.FC<{
    order: Order;
    onSelect: (id: string) => void;
    isNew: boolean;
    onActionClick: (order: Order, nextStatus: OrderStatus) => void;
    isUpdating: boolean;
    isJustUpdated: boolean;
}> = ({ order, onSelect, isNew, onActionClick, isUpdating, isJustUpdated }) => {

    const nextAction = NEXT_ACTION_MAP[order.status];

    const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent the card's onSelect from firing
        if (nextAction) {
            onActionClick(order, nextAction.nextStatus);
        }
    };

    const handleCardClick = () => {
        if (order.localId && order.localId !== 'missing-local-id') {
            onSelect(order.localId);
        } else {
            console.error("Cannot select order without a valid localId:", order);
            // Optionally, show an alert to the user.
            alert("Não é possível ver os detalhes deste pedido (ID local ausente).");
        }
    };

    return (
        <li
            onClick={handleCardClick}
            className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer border overflow-hidden flex flex-col ${isJustUpdated ? 'bg-green-50 border-green-400' : isNew ? 'bg-white border-green-500 border-2' : 'bg-white border-gray-200'}`}
        >
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-gray-800">{order.customerName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500">{order.displayId}</p>
                            {order.isIfood && (
                                <span className="text-red-800 font-bold text-sm">iFood</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <StatusBadge order={order} />
                    </div>
                </div>

                {order.isScheduled && order.deliveryWindow && (
                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800 text-xs flex items-start">
                        <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Pedido Agendado</p>
                            <p>Entregar entre {formatTime(order.deliveryWindow.start)} - {formatTime(order.deliveryWindow.end)}</p>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-between items-end">
                    <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
            </div>

            {nextAction && (
                <div className="px-4 pb-3 pt-1 flex justify-end">
                    <button
                        onClick={handleActionClick}
                        disabled={isUpdating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm flex items-center justify-center disabled:bg-indigo-300 disabled:cursor-wait"
                    >
                        {isUpdating ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                <span>{nextAction.text}</span>
                                <ChevronRightIcon className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </li>
    );
};

const FilterPanel: React.FC<{
    tempFilters: OrderFilters;
    onFilterChange: (filters: OrderFilters) => void;
    onApply: () => void;
    onClear: () => void;
}> = ({ tempFilters, onFilterChange, onApply, onClear }) => {

    const handleDateRangeClick = (range: 'today' | 'week' | 'month') => {
        onFilterChange({
            ...tempFilters,
            dateRange: tempFilters.dateRange === range ? '' : range,
            dateFrom: '', // Clear custom dates
            dateTo: '',   // Clear custom dates
        });
    };

    const handleDateInputChange = (field: 'dateFrom' | 'dateTo', value: string) => {
        onFilterChange({
            ...tempFilters,
            [field]: value,
            dateRange: '', // Clear preset range
        });
    };

    const filterableStatuses: OrderStatus[] = [
        OrderStatus.PLC,
        OrderStatus.COM,
        OrderStatus.CON,
        OrderStatus.CAN,
    ];

    return (
        <div className="p-4 bg-white rounded-lg shadow mb-4 border space-y-4">
            <div>
                <label className="flex items-center text-sm text-gray-500 cursor-not-allowed">
                    <input
                        type="checkbox"
                        checked
                        disabled
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 font-medium">iFood</span>
                </label>
            </div>

            <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                    type="text"
                    id="search"
                    placeholder="Nome ou Cód. do Pedido"
                    value={tempFilters.searchTerm || ''}
                    onChange={(e) => onFilterChange({ ...tempFilters, searchTerm: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
                />
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    id="status"
                    value={tempFilters.status || ''}
                    onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value as OrderStatus | '' })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                >
                    <option value="">Todos</option>
                    {filterableStatuses.map((statusKey) => (
                        <option key={statusKey} value={statusKey}>{ORDER_STATUS_MAP[statusKey].text}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <div className="flex space-x-2">
                    {(['today', 'week', 'month'] as const).map((range) => {
                        const labels = { today: 'Hoje', week: 'Esta Semana', month: 'Este Mês' };
                        return (
                            <button
                                key={range}
                                type="button"
                                onClick={() => handleDateRangeClick(range)}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${tempFilters.dateRange === range ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                {labels[range]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">De:</label>
                    <input
                        type="date"
                        id="dateFrom"
                        value={tempFilters.dateFrom || ''}
                        onChange={(e) => handleDateInputChange('dateFrom', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                    />
                </div>
                <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Até:</label>
                    <input
                        type="date"
                        id="dateTo"
                        value={tempFilters.dateTo || ''}
                        onChange={(e) => handleDateInputChange('dateTo', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                    />
                </div>
            </div>


            <div className="flex justify-end space-x-3 pt-2">
                <button onClick={onClear} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">Limpar</button>
                <button onClick={onApply} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Aplicar</button>
            </div>
        </div>
    );
};


const OrderList: React.FC<OrderListProps> = ({ onSelectOrder }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());
    const [justUpdatedOrderId, setJustUpdatedOrderId] = useState<string | null>(null);

    const defaultFilters: OrderFilters = { dateRange: 'today', perPage: 10 };
    const [filters, setFilters] = useState<OrderFilters>(defaultFilters);
    const [tempFilters, setTempFilters] = useState<OrderFilters>(defaultFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [isPollingActive, setIsPollingActive] = useState(false);
    const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        const savedMute = localStorage.getItem('isNotificationMuted');
        return savedMute ? JSON.parse(savedMute) : false;
    });

    // Effect to unlock audio playback on the first user interaction.
    // Browsers block programmatic audio playback until the user interacts with the page.
    useEffect(() => {
        const audioEl = audioRef.current;

        const handleFirstUserInteraction = () => {
            if (audioEl && audioEl.paused) {
                // The .load() method can help prepare the audio element for playback,
                // satisfying some browser policies after a user gesture.
                audioEl.load();
            }
            // Remove the listener so this logic only runs once.
            window.removeEventListener('click', handleFirstUserInteraction);
            window.removeEventListener('touchstart', handleFirstUserInteraction);
        };

        window.addEventListener('click', handleFirstUserInteraction);
        window.addEventListener('touchstart', handleFirstUserInteraction);

        return () => {
            window.removeEventListener('click', handleFirstUserInteraction);
            window.removeEventListener('touchstart', handleFirstUserInteraction);
        };
    }, []);


    useEffect(() => {
        localStorage.setItem('isNotificationMuted', JSON.stringify(isMuted));
    }, [isMuted]);


    const fetchOrders = useCallback(async (appliedFilters: OrderFilters, page: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const { orders: fetchedOrders, pagination: fetchedPagination } = await api.getOrders({ ...appliedFilters, page });

            setOrders(fetchedOrders);
            setPagination(fetchedPagination);

        } catch (err) {
            setError('Falha ao carregar pedidos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(filters, 1);
    }, [filters, fetchOrders]);

    const pollForNewOrders = useCallback(async () => {
        if (document.hidden) {
            return; // Don't poll if the tab is not visible
        }
        try {
            const pollFilters = { ...filters, dateRange: 'today' as const, page: 1 };
            const { orders: fetchedOrders, pagination: fetchedPagination } = await api.getOrders(pollFilters);

            setOrders(currentOrders => {
                const fetchedOrdersMap = new Map(fetchedOrders.map(o => [o.id, o]));
                const currentOrderIds = new Set(currentOrders.map(o => o.id));
                let hasChanged = false;

                // Update statuses of existing orders
                const updatedOrders = currentOrders.map(currentOrder => {
                    const fetchedOrder = fetchedOrdersMap.get(currentOrder.id);
                    if (fetchedOrder && fetchedOrder.status !== currentOrder.status) {
                        hasChanged = true;
                        // Trigger the visual flash for the updated order
                        setJustUpdatedOrderId(fetchedOrder.id);
                        setTimeout(() => setJustUpdatedOrderId(null), 1500);
                        return fetchedOrder; // Use the newer order data
                    }
                    return currentOrder; // No change, keep the existing order data
                });

                // Find and add brand new orders
                const newOrders = fetchedOrders.filter(o => !currentOrderIds.has(o.id));

                if (newOrders.length > 0) {
                    if (!isMuted && audioRef.current) {
                        audioRef.current.play().catch(error => {
                            console.warn("A reprodução do áudio foi impedida pelo navegador. A interação do usuário pode ser necessária para ativar o som.", error);
                        });
                    }
                    hasChanged = true;
                    setNewOrderIds(prevIds => {
                        const updatedIds = new Set(prevIds);
                        newOrders.forEach(o => updatedIds.add(o.id));
                        return updatedIds;
                    });
                }

                if (hasChanged) {
                    return [...newOrders, ...updatedOrders];
                }

                return currentOrders; // If no changes, return the original state to avoid re-render
            });

            // Update total count from the latest poll
            setPagination(prev => {
                if (prev && prev.total !== fetchedPagination.total) {
                    return { ...fetchedPagination, currentPage: prev.currentPage };
                }
                return prev;
            });

        } catch (err) {
            console.error("Polling for new orders failed:", err); // Log silently without showing UI error
        }
    }, [filters, isMuted]);

    // Effect to manage the polling interval
    useEffect(() => {
        const shouldPoll = (filters.dateRange === 'today' || !filters.dateRange) && !filters.dateFrom && !filters.dateTo;

        if (shouldPoll) {
            setIsPollingActive(true);
            const intervalId = setInterval(pollForNewOrders, 5000);
            return () => {
                clearInterval(intervalId);
                setIsPollingActive(false);
            };
        } else {
            setIsPollingActive(false);
        }
    }, [filters, pollForNewOrders]);


    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        const cleared: OrderFilters = { perPage: tempFilters.perPage || 10, dateRange: 'today' };
        setTempFilters(cleared);
        setFilters(cleared);
        setShowFilters(false);
    };

    const handleRefresh = () => {
        fetchOrders(filters, pagination?.currentPage || 1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (pagination?.totalPages ?? 1)) {
            fetchOrders(filters, newPage);
        }
    };

    const handleSelectAndMarkAsViewed = (orderId: string) => {
        setNewOrderIds(prevIds => {
            if (prevIds.has(orderId)) {
                const newIds = new Set(prevIds);
                newIds.delete(orderId);
                return newIds;
            }
            return prevIds;
        });
        onSelectOrder(orderId);
    };

    const handleActionClick = async (order: Order, nextStatus: OrderStatus) => {
        setUpdatingOrderIds(prev => new Set(prev).add(order.id));
        try {
            await api.updateOrderStatus(order, nextStatus);

            const updatedOrder = { ...order, status: nextStatus };
            setOrders(currentOrders =>
                currentOrders.map(o => o.id === order.id ? updatedOrder : o)
            );

            setJustUpdatedOrderId(updatedOrder.id);
            setTimeout(() => setJustUpdatedOrderId(null), 1500);

        } catch (err: any) {
            alert(`Erro ao atualizar pedido: ${err.message}`);
        } finally {
            setUpdatingOrderIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(order.id);
                return newSet;
            });
        }
    };


    const isFilterActive = !!(filters.searchTerm || filters.status || filters.dateFrom || filters.dateTo || (filters.dateRange && filters.dateRange !== 'today'));

    if (isLoading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-center text-gray-500">Carregando pedidos...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-2 sm:p-4">
            <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto" />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 px-2 mt-4">
                <h2 className="text-lg font-semibold text-gray-700 self-start sm:self-center">Pedidos ({pagination?.total ?? orders.length})</h2>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="flex-grow sm:flex-grow-0">
                        <select
                            id="perPage"
                            aria-label="Itens por página"
                            value={filters.perPage || 10}
                            onChange={(e) => setFilters(prev => ({ ...prev, perPage: parseInt(e.target.value, 10), page: 1 }))}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                        >
                            <option value="10">10 por página</option>
                            <option value="25">25 por página</option>
                            <option value="50">50 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50"
                            aria-label={isMuted ? "Ativar som de notificação" : "Desativar som de notificação"}
                        >
                            {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
                        </button>
                        <button
                            onClick={() => {
                                setTempFilters(filters);
                                setShowFilters(!showFilters)
                            }}
                            className={`${isFilterActive ? 'text-indigo-600' : 'text-gray-500'} hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50`}
                            aria-label="Filtrar pedidos"
                        >
                            <FilterIcon />
                        </button>
                        <button onClick={handleRefresh} className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" aria-label="Atualizar pedidos">
                            <RefreshIcon className={isPollingActive ? 'animate-pulse' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {showFilters && (
                <FilterPanel
                    tempFilters={tempFilters}
                    onFilterChange={setTempFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />
            )}

            {isLoading && !isPollingActive && (
                <div className="flex items-center justify-center p-4 text-gray-500">
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Atualizando...</span>
                </div>
            )}

            {!isLoading && (
                <>
                    {orders.length > 0 ? (
                        <ul className="space-y-3">
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onSelect={handleSelectAndMarkAsViewed}
                                    isNew={newOrderIds.has(order.id)}
                                    onActionClick={handleActionClick}
                                    isUpdating={updatingOrderIds.has(order.id)}
                                    isJustUpdated={justUpdatedOrderId === order.id}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Nenhum pedido encontrado.</p>
                    )}
                </>
            )}


            {!isLoading && pagination && (
                <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default OrderList;
