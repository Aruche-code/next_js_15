import { useCallback, useState } from 'react';

export type TooltipPosition = {
    x: number;
    y: number;
}

type EventHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
}

type UseTooltip = {
    isVisible: boolean;
    position: TooltipPosition;
    eventHandlers: EventHandlers;
}

export const useTooltip = (): UseTooltip => {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0 });

    const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
        setIsVisible(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsVisible(false);
    }, []);

    return {
        isVisible,
        position,
        eventHandlers: {
            onMouseEnter,
            onMouseLeave,
        },
    };
};