'use client';

import { useHover } from '@/app/fooks/useHover';
import { createClassNames } from '@/app/utils/createClassNames';
import styles from './index.module.scss';

const HoverWrapper = () => {
    const { isHovered, eventHandlers } = useHover();

    return (
        <div className={createClassNames(styles.hoverWrapper, (isHovered ? styles.hovered : ''))} {...eventHandlers}>
            {isHovered ? 'ホバー中です！' : 'ホバーしてみてください'}
        </div>
    );
};

export default HoverWrapper;