'use client';

import React from 'react';
import styles from './index.module.scss';

type Props = {
    content: React.ReactNode;
    position: {
        x: number;
        y: number;
    };
    className?: string;
}

const Tooltip = ({ content, position, className = '' }: Props) => {
    const style = {
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
    };

    return (
        <div className={`${styles.tooltip} ${className}`} style={style}>
            {content}
        </div>
    );
};

export default Tooltip;