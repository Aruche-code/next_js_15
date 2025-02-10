'use client';

import { useHover } from '@/app/fooks/useHover';
import React from 'react';

type Props = {
    children: React.ReactNode;
}

const HoverWrapper = ({ children }: Props) => {
    const { isHovered, eventHandlers } = useHover();

    return (
        <div {...eventHandlers}>
            {isHovered && children}
        </div>
    );
};

export default HoverWrapper;