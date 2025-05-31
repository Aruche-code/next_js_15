'use client';

import Tooltip from '@/app/components/base/atoms/ToolTip';
import { useTooltip } from '@/app/hooks/useToolTip';

type Props = {
    children: React.ReactNode;
    tooltipContent: React.ReactNode;
}

const ToolTipWrapper = ({ children, tooltipContent }: Props) => {
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
            {isVisible && (<Tooltip content={tooltipContent} position={position} />)}
        </div>
    );
};

export default ToolTipWrapper;