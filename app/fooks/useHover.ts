import { useCallback, useState } from 'react';

type EventHandlers = {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}
type UseHover = {
    isHovered: boolean;
    eventHandlers: EventHandlers;
}

export const useHover = (): UseHover => {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const onMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    return {
        isHovered,
        eventHandlers: {
            onMouseEnter,
            onMouseLeave,
        },
    };
};