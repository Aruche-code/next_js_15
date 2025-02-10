'use client';

import Tooltip from '@/app/components/ui/shared/ToolTip';
import { useTooltip } from '@/app/fooks/useToolTip';

type Props = {
    children: React.ReactNode;
    toolTipContent: React.ReactNode;
}

const ToolTipWrapper = ({ children, toolTipContent }: Props) => {
    const { isVisible, position, eventHandlers } = useTooltip();

    return (
        <div
            {...eventHandlers}
            style={{
                display: 'inline-block',
                padding: '20px',
                background: '#eee',
                cursor: 'pointer',
            }}
        >
            {children}
            {isVisible && (<Tooltip content={toolTipContent} position={position} />)}
        </div>
    );
};

export default ToolTipWrapper;